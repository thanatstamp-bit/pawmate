"use client";

import { useRef, useState } from "react";
import { PlusCircle, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  photos: string[];
  name: string;
  onChange: (photos: string[], name: string) => void;
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm " +
  "placeholder:text-brown-muted/60 focus:border-coral focus:outline-none " +
  "focus:ring-2 focus:ring-coral/30";

export default function Step1Photos({ photos, name, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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

      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("pet-photos")
          .upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      onChange([...photos, ...uploadedUrls], name);
    } catch {
      setUploadError("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(idx: number) {
    onChange(
      photos.filter((_, i) => i !== idx),
      name
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 2×2 photo grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => {
          const url = photos[idx];
          const isNext = idx === photos.length;

          return (
            <div
              key={idx}
              className="relative aspect-square overflow-hidden rounded-card border-2 border-dashed border-black/10 bg-cream"
            >
              {url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`รูปน้อง ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">
                      รูปหลัก
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : isNext ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 text-brown-muted transition-colors hover:text-brown"
                >
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <PlusCircle size={24} />
                  )}
                  <span className="text-xs">
                    {uploading ? "กำลังอัปโหลด..." : "เพิ่มรูป"}
                  </span>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="rounded-xl bg-coral/10 px-4 py-2 text-sm text-coral-dark">
          {uploadError}
        </p>
      )}

      <div>
        <label className="mb-2 block text-sm font-bold text-brown">
          ชื่อน้อง
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(photos, e.target.value)}
          placeholder="เช่น น้องลาเต้, เจ้าถุงเงิน, มะลิ"
          maxLength={50}
          className={inputClass}
        />
      </div>
    </div>
  );
}
