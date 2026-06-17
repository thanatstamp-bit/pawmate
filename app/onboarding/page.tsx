"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Step1Photos from "@/components/onboarding/Step1Photos";
import Step2Basic from "@/components/onboarding/Step2Basic";
import Step3Personality from "@/components/onboarding/Step3Personality";
import Step4Modes from "@/components/onboarding/Step4Modes";

type WizardData = {
  photos: string[];
  name: string;
  species: "dog" | "cat" | "";
  breed: string;
  sex: "male" | "female" | "";
  birthYear: number;
  birthMonthNum: number;
  personalityTags: string[];
  province: string;
  district: string;
  bio: string;
  modes: ("playdate" | "breeding")[];
  vaccinated: boolean | null;
  neutered: boolean | null;
};

const STEP_TITLES = [
  "รูปและชื่อ",
  "ข้อมูลพื้นฐาน",
  "นิสัยและพื้นที่",
  "โหมดที่เปิดรับ",
];

const TOTAL = 4;

function validate(step: number, data: WizardData): string | null {
  if (step === 1) {
    if (data.photos.length === 0) return "กรุณาอัปโหลดรูปน้องอย่างน้อย 1 รูป";
    if (!data.name.trim()) return "กรุณากรอกชื่อน้อง";
  }
  if (step === 2) {
    if (!data.species) return "กรุณาเลือกว่าน้องเป็นหมาหรือแมว";
    if (!data.breed) return "กรุณาเลือกสายพันธุ์";
    if (!data.sex) return "กรุณาเลือกเพศน้อง";
    if (!data.birthYear || !data.birthMonthNum) return "กรุณาเลือกเดือนและปีเกิด";
  }
  if (step === 3) {
    if (data.personalityTags.length === 0)
      return "เลือกนิสัยน้องสักอย่างนึงนะ";
    if (!data.province) return "กรุณาเลือกจังหวัด";
  }
  if (step === 4) {
    if (data.modes.length === 0) return "กรุณาเลือกอย่างน้อย 1 โหมด";
  }
  return null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<WizardData>({
    photos: [],
    name: "",
    species: "",
    breed: "",
    sex: "",
    birthYear: 0,
    birthMonthNum: 0,
    personalityTags: [],
    province: "",
    district: "",
    bio: "",
    modes: ["playdate"],
    vaccinated: null,
    neutered: null,
  });

  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
    setError(null);
  }

  function handleNext() {
    const err = validate(step, data);
    if (err) { setError(err); return; }
    setError(null);
    if (step < TOTAL) { setStep(step + 1); return; }
    handleSubmit();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");

      const birthMonth = `${data.birthYear}-${String(data.birthMonthNum).padStart(2, "0")}-01`;

      const { data: newPet, error: insertError } = await supabase
        .from("pets")
        .insert({
          owner_id: user.id,
          name: data.name.trim(),
          species: data.species,
          breed: data.breed,
          sex: data.sex,
          birth_month: birthMonth,
          photos: data.photos,
          personality_tags: data.personalityTags,
          province: data.province,
          district: data.district || null,
          modes: data.modes,
          vaccinated: data.vaccinated,
          neutered: data.neutered,
          bio: data.bio || null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      // Set the new pet as active so the swipe/profile pages pick it up
      if (newPet?.id) localStorage.setItem("pawmate_active_pet_id", newPet.id);
      router.push("/app/profile");
      router.refresh();
    } catch {
      setError("บันทึกข้อมูลไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pb-2 pt-6">
        <button
          type="button"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
              setError(null);
            } else {
              router.back();
            }
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-card"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-brown-muted">ขั้นตอน {step}/{TOTAL}</p>
          <h1 className="text-lg font-bold text-brown">{STEP_TITLES[step - 1]}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 pb-6 pt-2">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < step ? "bg-coral" : "bg-black/10"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {step === 1 && (
          <Step1Photos
            photos={data.photos}
            name={data.name}
            onChange={(photos, name) => update({ photos, name })}
          />
        )}
        {step === 2 && (
          <Step2Basic
            species={data.species}
            breed={data.breed}
            sex={data.sex}
            birthYear={data.birthYear}
            birthMonthNum={data.birthMonthNum}
            onChange={update}
          />
        )}
        {step === 3 && (
          <Step3Personality
            personalityTags={data.personalityTags}
            province={data.province}
            district={data.district}
            bio={data.bio}
            onChange={update}
          />
        )}
        {step === 4 && (
          <Step4Modes
            modes={data.modes}
            vaccinated={data.vaccinated}
            neutered={data.neutered}
            onChange={update}
          />
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-coral/10 px-4 py-2 text-sm text-coral-dark">
            {error}
          </p>
        )}
      </div>

      {/* Bottom action button */}
      <div className="border-t border-black/5 bg-white px-6 py-4">
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3.5 font-bold text-white transition-colors hover:bg-coral-dark disabled:opacity-60"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {step < TOTAL ? "ถัดไป" : "สร้างโปรไฟล์น้อง"}
        </button>
      </div>
    </main>
  );
}
