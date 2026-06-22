"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Calendar,
  MapPin,
  Phone,
  X,
  Plus,
  Loader2,
  Share2,
  Check,
  ImagePlus,
  AlertCircle,
  Gift,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PROVINCES } from "@/lib/data/provinces";
import LostPetCard, { type LostPet } from "@/components/lost/LostPetCard";

type Species = "dog" | "cat" | "other";

const SPECIES: { value: Species; label: string }[] = [
  { value: "dog", label: "สุนัข" },
  { value: "cat", label: "แมว" },
  { value: "other", label: "อื่นๆ" },
];

const fieldShell =
  "flex items-center gap-2.5 h-[52px] px-3.5 rounded-[14px] border-[1.5px] border-line bg-white " +
  "shadow-[0_1px_2px_rgba(120,72,60,.04)] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/15 transition-colors";
const bareInput =
  "min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink placeholder:text-ink-3 focus:outline-none";
const labelClass = "block text-[13px] font-semibold text-ink";

export default function NewLostPetPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<Species | "">("");
  const [breed, setBreed] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [reward, setReward] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [postedId, setPostedId] = useState("");
  const [postedPetName, setPostedPetName] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const canSubmit =
    photos.length > 0 &&
    petName.trim() &&
    species &&
    district.trim() &&
    province &&
    lostDate &&
    contact.trim() &&
    !saving &&
    !uploading;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = 4 - photos.length;
    if (remaining <= 0) {
      setUploadError("อัปโหลดได้สูงสุด 4 รูปนะ");
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploading(true);
    setUploadError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");

      const urls: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("pet-photos")
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      setUploadError("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");

      const { data, error: insertErr } = await supabase
        .from("lost_pets")
        .insert({
          reporter_id: user.id,
          pet_name: petName.trim(),
          species,
          breed: breed.trim(),
          photos,
          last_seen_province: province,
          last_seen_district: district.trim(),
          lost_date: lostDate,
          distinguishing_marks: description.trim() || null,
          contact: contact.trim(),
          reward: reward.trim() || null,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      setPostedId(data.id);
      setPostedPetName(petName.trim());
      setShowSuccess(true);
    } catch {
      setError("ไม่สามารถส่งประกาศได้ ลองใหม่อีกครั้งนะ");
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/lost/${postedId}`;
    if (navigator.share) {
      navigator.share({ title: `ตามหา${postedPetName}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  if (showSuccess) {
    const previewPost: LostPet = {
      id: postedId,
      pet_name: postedPetName,
      species: species as Species,
      breed,
      photos,
      last_seen_province: province,
      last_seen_district: district,
      lost_date: lostDate,
      status: "lost",
      created_at: new Date().toISOString(),
    };

    return (
      <div className="flex min-h-screen flex-col bg-gradient-app">
        <div className="flex h-14 shrink-0 items-center border-b border-line bg-white/80 px-5 backdrop-blur">
          <span className="text-[17px] font-bold tracking-tight2 text-ink">แจ้งสัตว์หาย</span>
        </div>

        <div className="flex flex-1 flex-col items-center px-6 pb-10 pt-9">
          {/* Check ring */}
          <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-teal-soft">
            <Check size={36} strokeWidth={2.2} className="text-teal-ink" />
          </div>
          <p className="mb-2 text-center text-[19px] font-bold leading-snug text-ink">
            ส่งประกาศแล้ว!
          </p>
          <p className="mb-7 text-center text-[13px] leading-relaxed text-ink-2">
            ประกาศของ{postedPetName}ถูกเผยแพร่แล้ว
            <br />
            ขอให้เจอน้องเร็วๆ นะ 🧡
          </p>

          {/* Post card preview */}
          <div className="mb-6 w-full">
            <LostPetCard post={previewPost} />
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push(`/app/care/lost/${postedId}`)}
              className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-cta font-bold tracking-tight2 text-white shadow-cta transition-transform active:scale-[.98]"
            >
              ดูประกาศของฉัน
            </button>
            <button
              type="button"
              onClick={() => router.push("/app/care/lost")}
              className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-fill-2 font-semibold text-ink-2 transition-opacity active:opacity-80"
            >
              กลับหน้าประกาศ
            </button>
          </div>

          {/* Share nudge */}
          <div className="mt-5 flex w-full items-center gap-3 rounded-[14px] border-[1.5px] border-coral-soft bg-cream px-3.5 py-3">
            <Share2 size={18} className="shrink-0 text-coral-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink">แชร์ให้เพื่อนช่วยตาม</p>
              <p className="text-[11px] leading-snug text-ink-2">
                ยิ่งมีคนรู้ ยิ่งมีโอกาสเจอน้องเร็วขึ้น
              </p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-8 shrink-0 items-center rounded-[9px] bg-gradient-cta px-3"
            >
              <span className="text-[12px] font-bold text-white">แชร์</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-app">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-[22px] pb-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-ink shadow-[0_6px_16px_-10px_rgba(120,72,60,.3)] transition-transform active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-bold leading-tight tracking-title text-ink">
            แจ้งสัตว์หาย
          </h1>
          <p className="mt-px text-[12px] text-ink-2">
            ยิ่งรายละเอียดครบ ยิ่งช่วยตามหาน้องได้ไว
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-[22px] pb-6 pt-[18px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Photo section */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink">รูปน้อง</span>
          <span className="text-[12px] font-semibold text-coral-ink">*</span>
          <span className="text-[12px] text-ink-3">เพิ่มได้สูงสุด 4 รูป</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, idx) => {
            const url = photos[idx];
            const isNext = idx === photos.length && photos.length < 4;
            const isCover = idx === 0;

            if (url) {
              return (
                <div key={idx} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`รูป ${idx + 1}`}
                    className="h-full w-full rounded-[14px] object-cover"
                  />
                  {isCover && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-[7px] bg-black/35 px-1.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm">
                      ปก
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/45 backdrop-blur-sm"
                  >
                    <X size={11} className="text-white" />
                  </button>
                </div>
              );
            }
            if (isNext) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed transition-transform active:scale-95 ${
                    isCover
                      ? "border-coral/40 bg-coral-soft/40"
                      : "border-fill-3 bg-bg-bot"
                  }`}
                >
                  {uploading ? (
                    <Loader2
                      size={18}
                      className={`animate-spin ${isCover ? "text-coral-ink" : "text-ink-3"}`}
                    />
                  ) : (
                    <ImagePlus
                      size={20}
                      className={isCover ? "text-coral-ink" : "text-ink-3"}
                    />
                  )}
                  <span
                    className={`text-[10px] font-semibold ${
                      isCover ? "text-coral-ink" : "text-ink-3"
                    }`}
                  >
                    {isCover ? "รูปปก" : "เพิ่มรูป"}
                  </span>
                </button>
              );
            }
            return (
              <div
                key={idx}
                className="aspect-square rounded-[14px] border-2 border-dashed border-line bg-bg-bot"
              />
            );
          })}
        </div>
        {uploadError && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-rose-ink" />
            <span className="text-[12.5px] font-medium text-rose-ink">{uploadError}</span>
          </div>
        )}

        {/* ชื่อน้อง */}
        <div className="mt-5">
          <label className={`${labelClass} mb-[7px]`}>ชื่อน้อง</label>
          <div className={fieldShell}>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="เช่น ข้าวตัง"
              className={bareInput}
              maxLength={50}
            />
          </div>
        </div>

        {/* ชนิด + สายพันธุ์ */}
        <div className="mt-4 flex gap-2.5">
          <div className="basis-[42%]">
            <label className={`${labelClass} mb-[7px]`}>ชนิด</label>
            <div className={`${fieldShell} pr-1.5`}>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
                className={`${bareInput} appearance-none cursor-pointer ${
                  species ? "" : "text-ink-3"
                }`}
              >
                <option value="">เลือก</option>
                {SPECIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none shrink-0 text-ink-3" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label className={`${labelClass} mb-[7px]`}>
              สายพันธุ์{" "}
              <span className="text-[12px] font-normal text-ink-3">(ถ้าทราบ)</span>
            </label>
            <div className={fieldShell}>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="เช่น พันธุ์ไทย"
                className={bareInput}
                maxLength={50}
              />
            </div>
          </div>
        </div>

        {/* จังหวัด + อำเภอ */}
        <div className="mt-4 flex gap-2.5">
          <div className="min-w-0 flex-1">
            <label className={`${labelClass} mb-[7px]`}>จังหวัด</label>
            <div className={`${fieldShell} pr-1.5`}>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={`${bareInput} appearance-none cursor-pointer ${
                  province ? "" : "text-ink-3"
                }`}
              >
                <option value="">เลือก</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none shrink-0 text-ink-3" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label className={`${labelClass} mb-[7px]`}>อำเภอ / เขต</label>
            <div className={fieldShell}>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="เช่น เขตจตุจักร"
                className={bareInput}
                maxLength={60}
              />
            </div>
          </div>
        </div>

        {/* วันที่หาย */}
        <div className="mt-4">
          <label className={`${labelClass} mb-[7px]`}>วันที่หาย</label>
          <div className={fieldShell}>
            <Calendar size={18} className="shrink-0 text-ink-3" />
            <input
              type="date"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              max={today}
              className={bareInput}
            />
          </div>
        </div>

        {/* ลักษณะเด่น */}
        <div className="mt-4">
          <label className={`${labelClass} mb-[7px]`}>ลักษณะเด่น</label>
          <div className="rounded-[14px] border-[1.5px] border-line bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(120,72,60,.04)] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/15">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น มีปลอกคอสีแดง ขาหลังขวามีจุดขาว ขี้กลัวคนแปลกหน้า"
              rows={3}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none"
            />
          </div>
        </div>

        {/* ช่องทางติดต่อ */}
        <div className="mt-4">
          <label className={`${labelClass} mb-[7px]`}>ช่องทางติดต่อ</label>
          <div className={fieldShell}>
            <Phone size={18} className="shrink-0 text-ink-3" />
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="เบอร์โทร หรือ LINE ID"
              className={bareInput}
              maxLength={80}
            />
          </div>
          <p className="mt-1.5 pl-0.5 text-[11px] text-ink-3">
            แสดงเฉพาะผู้ที่คุณอนุญาต
          </p>
        </div>

        {/* ของรางวัล */}
        <div className="mt-4">
          <label className={`${labelClass} mb-[7px]`}>
            ของรางวัล{" "}
            <span className="text-[12px] font-normal text-ink-3">(ไม่บังคับ)</span>
          </label>
          <div className={fieldShell}>
            <Gift size={18} className="shrink-0 text-ink-3" />
            <input
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="เช่น มีสินน้ำใจ 1,000 บาท"
              className={bareInput}
              maxLength={100}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2 text-sm text-rose-ink">
            {error}
          </p>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div className="shrink-0 border-t border-line bg-white/85 px-[22px] pb-[30px] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] font-bold tracking-tight2 transition-transform active:scale-[.98] ${
            canSubmit
              ? "bg-gradient-cta text-white shadow-cta"
              : "bg-fill-3 text-ink-3"
          }`}
        >
          {saving ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <>
              <Plus size={18} strokeWidth={2.5} />
              <span className="text-[17px]">โพสต์ประกาศ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
