"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Calendar,
  X,
  Plus,
  Loader2,
  Share2,
  Check,
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

const inputClass =
  "w-full rounded-[13px] border border-[#EDEAE6] bg-white px-3.5 py-3 text-[14px] " +
  "text-brown placeholder:text-[#C5C0BB] focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

const labelClass = "block text-[13px] font-semibold text-brown";

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
      <div className="flex min-h-screen flex-col bg-cream">
        <div className="flex h-14 shrink-0 items-center border-b border-black/5 bg-white px-5">
          <span className="text-[17px] font-bold text-brown">แจ้งสัตว์หาย</span>
        </div>

        <div className="flex flex-1 flex-col items-center px-6 pb-10 pt-9">
          {/* Check ring */}
          <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-teal/10">
            <Check size={36} strokeWidth={2.2} className="text-teal" />
          </div>
          <p className="mb-2 text-center text-[19px] font-bold leading-snug text-brown">
            ส่งประกาศแล้ว!
          </p>
          <p className="mb-7 text-center text-[13px] leading-relaxed text-brown-muted">
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
              className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-coral font-bold text-white shadow-[0_4px_16px_rgba(255,107,91,0.24)] transition-opacity active:opacity-90"
            >
              ดูประกาศของฉัน
            </button>
            <button
              type="button"
              onClick={() => router.push("/app/care/lost")}
              className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#F5F3F0] font-semibold text-[#5A5650] transition-opacity active:opacity-80"
            >
              กลับหน้าประกาศ
            </button>
          </div>

          {/* Share nudge */}
          <div className="mt-5 flex w-full items-center gap-3 rounded-[14px] border border-[#FDDEC8] bg-[#FFF8F0] px-3.5 py-3">
            <Share2 size={18} className="shrink-0 text-[#E8863A]" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-brown">แชร์ให้เพื่อนช่วยตาม</p>
              <p className="text-[11px] leading-snug text-brown-muted">
                ยิ่งมีคนรู้ ยิ่งมีโอกาสเจอน้องเร็วขึ้น
              </p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-8 shrink-0 items-center rounded-[9px] bg-[#E8863A] px-3"
            >
              <span className="text-[12px] font-bold text-white">แชร์</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 bg-white px-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-brown"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[17px] font-bold text-brown">แจ้งสัตว์หาย</span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Photo section */}
        <div className="mb-5">
          {photos.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-[156px] w-full flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#D5D1CC] bg-[#FAF9F7]"
            >
              {uploading ? (
                <Loader2 size={28} className="animate-spin text-brown-muted" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EDEAE6]">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8A8580"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              <span className="text-[13px] font-medium text-brown-muted">เพิ่มรูปน้อง</span>
              <span className="text-[11px] text-[#B5B0AA]">อัปโหลดได้สูงสุด 4 รูป</span>
            </button>
          ) : (
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, idx) => {
                const url = photos[idx];
                const isNext = idx === photos.length && photos.length < 4;

                if (url) {
                  return (
                    <div
                      key={idx}
                      className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[14px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`รูป ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55"
                      >
                        <X size={10} className="text-white" />
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
                      className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[14px] border-2 border-dashed border-[#D5D1CC] bg-[#FAF9F7]"
                    >
                      {uploading ? (
                        <Loader2 size={18} className="animate-spin text-brown-muted" />
                      ) : (
                        <Plus size={20} className="text-[#C5C0BB]" />
                      )}
                    </button>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="h-[88px] w-[88px] shrink-0 rounded-[14px] border-2 border-dashed border-[#EDEAE6] bg-[#FAF9F7]"
                  />
                );
              })}
            </div>
          )}
          {uploadError && (
            <p className="mt-2 text-[12px] text-coral">{uploadError}</p>
          )}
        </div>

        {/* ชื่อน้อง */}
        <div className="mb-5">
          <label className={`${labelClass} mb-1.5`}>
            ชื่อน้อง <span className="text-[#A82040]">*</span>
          </label>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="เช่น บัตเตอร์สก็อตช์"
            className={inputClass}
            maxLength={50}
          />
        </div>

        {/* ชนิดสัตว์ */}
        <div className="mb-5">
          <label className={`${labelClass} mb-2`}>
            ชนิดสัตว์ <span className="text-[#A82040]">*</span>
          </label>
          <div className="flex gap-2">
            {SPECIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpecies(value)}
                className={`flex h-11 flex-1 items-center justify-center rounded-[13px] border text-[14px] transition-colors ${
                  species === value
                    ? "border-coral bg-coral/[0.07] font-semibold text-coral"
                    : "border-[#EDEAE6] bg-white text-[#B5B0AA]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* สายพันธุ์ */}
        <div className="mb-5">
          <label className={`${labelClass} mb-1.5`}>
            สายพันธุ์{" "}
            <span className="text-[11px] font-normal text-[#B5B0AA]">(ถ้าทราบ)</span>
          </label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="เช่น โกลเด้น รีทรีฟเวอร์"
            className={inputClass}
            maxLength={50}
          />
        </div>

        {/* หายแถวไหน */}
        <div className="mb-5">
          <label className={`${labelClass} mb-2`}>
            หายแถวไหน <span className="text-[#A82040]">*</span>
          </label>
          <div className="flex gap-2.5">
            {/* District — free text */}
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="อำเภอ"
              className={`${inputClass} flex-1 min-w-0`}
              maxLength={60}
            />
            {/* Province — select */}
            <div className="relative flex flex-1 min-w-0 items-center">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={`${inputClass} w-full appearance-none pr-7`}
              >
                <option value="">จังหวัด</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 text-brown-muted"
              />
            </div>
          </div>
        </div>

        {/* วันที่หาย */}
        <div className="mb-5">
          <label className={`${labelClass} mb-1.5`}>
            วันที่หาย <span className="text-[#A82040]">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              max={today}
              className={`${inputClass} pr-10`}
            />
            <Calendar
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted"
            />
          </div>
        </div>

        {/* รายละเอียดเพิ่มเติม */}
        <div className="mb-5">
          <label className={`${labelClass} mb-1.5`}>รายละเอียดเพิ่มเติม</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เช่น ลักษณะพิเศษ สี ขนาด ปลอกคอ"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* เบอร์ติดต่อ */}
        <div className="mb-7">
          <label className={`${labelClass} mb-1.5`}>
            เบอร์ติดต่อ <span className="text-[#A82040]">*</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="08x-xxx-xxxx"
            className={inputClass}
            maxLength={80}
          />
          <p className="mt-1 pl-0.5 text-[11px] text-[#B5B0AA]">
            แสดงเฉพาะผู้ที่คุณอนุญาต
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-coral/10 px-4 py-2 text-sm text-coral-dark">
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            background: canSubmit ? "#FF6B5B" : "#EDEAE6",
          }}
          className="flex h-[54px] w-full items-center justify-center rounded-2xl font-bold transition-opacity active:opacity-90"
        >
          {saving ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <span style={{ color: canSubmit ? "white" : "#B5B0AA" }}>โพสต์ประกาศ</span>
          )}
        </button>
      </div>
    </div>
  );
}
