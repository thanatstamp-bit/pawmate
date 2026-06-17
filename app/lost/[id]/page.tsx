import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Calendar, Eye, DollarSign, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Props = { params: { id: string } };

type LostPetFull = {
  id: string;
  reporter_id: string;
  pet_name: string;
  species: string;
  breed: string;
  photos: string[];
  last_seen_province: string;
  last_seen_district: string;
  last_seen_detail: string | null;
  lost_date: string;
  distinguishing_marks: string | null;
  contact: string;
  reward: string | null;
  status: "lost" | "found";
  created_at: string;
};

type Sighting = {
  id: string;
  detail: string;
  seen_at_location: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

const SPECIES_LABEL: Record<string, string> = {
  dog: "สุนัข",
  cat: "แมว",
  other: "อื่นๆ",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("lost_pets")
    .select("pet_name, last_seen_district, last_seen_province, photos, breed, species")
    .eq("id", params.id)
    .single();

  if (!post) return { title: "ประกาศสัตว์หาย — PawMate" };

  return {
    title: `ตามหา${post.pet_name} หายแถว${post.last_seen_district} — PawMate`,
    openGraph: {
      title: `ตามหา${post.pet_name} หายแถว${post.last_seen_district}`,
      description: `ช่วยตามหา ${post.pet_name} (${post.breed || SPECIES_LABEL[post.species] || post.species}) หายแถว${post.last_seen_district} ${post.last_seen_province}`,
      images: post.photos[0] ? [{ url: post.photos[0] }] : [],
      type: "website",
    },
  };
}

function thaiDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysLost(lostDate: string): number {
  return Math.floor(
    (Date.now() - new Date(lostDate + "T00:00:00").getTime()) / 86_400_000
  );
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "เมื่อวาน";
  return `${days} วันที่แล้ว`;
}

const factRowClass =
  "flex items-start gap-2.5 px-3.5 py-2.5 border-b border-[#F0EFEC] last:border-0";
const factLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-[#AAA]";

export default async function PublicLostPetPage({ params }: Props) {
  const supabase = createClient();

  const [postRes, sightingsRes] = await Promise.all([
    supabase
      .from("lost_pets")
      .select("*, profiles!reporter_id(display_name)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("lost_pet_sightings")
      .select(
        "id, detail, seen_at_location, created_at, reporter_id, profiles(display_name)"
      )
      .eq("lost_pet_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!postRes.data || postRes.error) notFound();

  const post = postRes.data as LostPetFull & { profiles: { display_name: string } | null };
  const sightings = (sightingsRes.data as unknown as Sighting[]) ?? [];
  const days = daysLost(post.lost_date);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[#F8F7F5]">
      {/* Login banner */}
      <div className="sticky top-0 z-10 bg-amber px-4 py-3 text-center shadow-sm">
        <span className="text-[13px] text-white">
          พบเห็นน้องตัวนี้?{" "}
          <a
            href={`/login?redirect=/lost/${params.id}`}
            className="font-bold underline underline-offset-2"
          >
            เข้าสู่ระบบเพื่อแจ้งเบาะแส
          </a>
        </span>
      </div>

      {/* Photo (first only, static) */}
      <div className="relative h-[220px] overflow-hidden bg-[#CCCAC7]">
        {post.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.photos[0]}
            alt={post.pet_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-[#AAA]">ไม่มีรูปภาพ</span>
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-semibold text-white"
          style={{ background: post.status === "found" ? "#2A9D8F" : "#E0445A" }}
        >
          {post.status === "found" ? "พบแล้ว" : "ยังตามหา"}
        </span>
      </div>

      {/* Found banner */}
      {post.status === "found" && (
        <div className="flex flex-col items-center gap-1 border-b border-[#BEE6E2] bg-[#EDF7F6] py-4">
          <p className="text-[17px] font-bold text-teal">น้องกลับบ้านแล้ว!</p>
          <p className="text-[13px] text-teal/80">ขอบคุณทุกเบาะแสจากเพื่อนๆ</p>
        </div>
      )}

      <div className="px-4 pt-4">
        {/* Pet name */}
        <div className="mb-3.5">
          <h1 className="text-[22px] font-bold text-brown">{post.pet_name}</h1>
          <p className="mt-0.5 text-[13px] font-medium text-[#888]">
            {SPECIES_LABEL[post.species] ?? post.species}
            {post.breed ? ` · ${post.breed}` : ""}
          </p>
        </div>

        {/* Facts card */}
        <div className="mb-3.5 overflow-hidden rounded-2xl border border-[#E4E3DF] bg-white">
          <div className={factRowClass}>
            <MapPin size={16} className="mt-0.5 shrink-0 text-[#888]" />
            <div>
              <p className={factLabelClass}>หายแถว</p>
              <p className="mt-0.5 text-[14px] font-medium text-brown">
                {post.last_seen_district} {post.last_seen_province}
              </p>
            </div>
          </div>
          <div className={factRowClass}>
            <Calendar size={16} className="mt-0.5 shrink-0 text-[#888]" />
            <div>
              <p className={factLabelClass}>วันที่หาย</p>
              <p className="mt-0.5 text-[14px] font-medium text-brown">
                {thaiDate(post.lost_date)}
                {post.status === "lost" && days > 0 && (
                  <span className="ml-2 text-[12px] font-normal text-[#E0445A]">
                    ({days} วันที่ผ่านมา)
                  </span>
                )}
              </p>
            </div>
          </div>
          {post.distinguishing_marks && (
            <div className={factRowClass}>
              <Eye size={16} className="mt-0.5 shrink-0 text-[#888]" />
              <div>
                <p className={factLabelClass}>ลักษณะเด่น</p>
                <p className="mt-0.5 text-[14px] font-medium leading-snug text-brown">
                  {post.distinguishing_marks}
                </p>
              </div>
            </div>
          )}
          {post.reward && (
            <div className={factRowClass}>
              <DollarSign size={16} className="mt-0.5 shrink-0 text-[#888]" />
              <div>
                <p className={factLabelClass}>ของรางวัล</p>
                <p className="mt-0.5 text-[14px] font-bold text-brown">{post.reward}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reporter */}
        <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-[#E4E3DF] bg-white px-3.5 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D8D7D3]">
            <User size={17} className="text-[#AAA]" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#AAA]">เจ้าของ</p>
            <p className="text-[15px] font-semibold text-brown">
              {post.profiles?.display_name ?? "ผู้ใช้งาน"}
            </p>
          </div>
        </div>

        {/* CTA to login */}
        {post.status === "lost" && (
          <a
            href={`/login?redirect=/lost/${params.id}`}
            className="mb-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
            style={{ background: "#E8724A" }}
          >
            <MapPin size={16} />
            แจ้งเบาะแส (เข้าสู่ระบบ)
          </a>
        )}

        {/* Sightings */}
        <div className="mb-6">
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-[15px] font-bold text-brown">
              {post.status === "found" ? "เบาะแสที่ช่วยพบ" : "เบาะแสที่ได้รับ"}
            </h2>
            <span className="text-[13px] text-[#888]">({sightings.length} รายการ)</span>
          </div>

          {sightings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#D8D7D3] px-5 py-8 text-center">
              <p className="text-[15px] font-semibold text-[#888]">ยังไม่มีเบาะแส</p>
              <p className="text-[13px] text-[#AAA]">
                ช่วยแชร์โพสต์นี้เพื่อให้คนอื่นๆ ช่วยตามหา
              </p>
            </div>
          ) : (
            <div>
              {sightings.map((s, i) => (
                <div key={s.id} className="flex gap-2.5">
                  <div className="flex w-9 flex-col items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D8D7D3]">
                      <User size={15} className="text-[#AAA]" />
                    </div>
                    {i < sightings.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-[#E4E3DF]" style={{ minHeight: 24 }} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-brown">
                        {s.profiles?.display_name ?? "ผู้ใช้งาน"}
                      </span>
                      <span className="text-[11px] text-[#AAA]">{timeAgo(s.created_at)}</span>
                    </div>
                    <p className="mb-2 text-[13px] leading-snug text-[#555]">{s.detail}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EFE9] px-2.5 py-1 text-[11px] font-medium text-[#666]">
                      <MapPin size={11} className="text-[#888]" />
                      {s.seen_at_location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PawMate footer */}
        <div className="mb-8 flex flex-col items-center gap-1.5 rounded-2xl border border-[#E4E3DF] bg-white px-5 py-5 text-center">
          <p className="text-[13px] font-bold text-brown">PawMate</p>
          <p className="text-[12px] leading-relaxed text-[#AAA]">
            แอปหาเพื่อนและคู่ให้เจ้าตัวน้อย
            <br />
            ช่วยกันตามหาน้องด้วยนะ
          </p>
          <a
            href="/login"
            className="mt-2 flex h-9 items-center rounded-full bg-coral px-5 text-[13px] font-bold text-white"
          >
            สมัครฟรี
          </a>
        </div>
      </div>
    </div>
  );
}
