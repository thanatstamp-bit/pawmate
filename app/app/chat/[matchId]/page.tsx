"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send, CalendarDays, MoreVertical, User, Star, Flag, Ban, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBlockedPetIds } from "@/lib/blocks";
import ScheduleSheet from "@/components/playdates/ScheduleSheet";
import ProposalBanner, { type ProposalData } from "@/components/playdates/ProposalBanner";
import PetProfileSheet from "@/components/chat/PetProfileSheet";
import ReviewModal from "@/components/trust/ReviewModal";
import ReportSheet from "@/components/trust/ReportSheet";
import BlockConfirm from "@/components/trust/BlockConfirm";
import Toast from "@/components/trust/Toast";
import type { PetCardData } from "@/components/swipe/PetCard";
import { Avatar } from "@/components/ui";

const OPENERS = ["สวัสดีครับ/ค่ะ 🐾", "น้องน่ารักมากเลย!", "ว่างไปเดินเล่นด้วยกันไหม?"];

type Message = {
  id: string;
  content: string;
  sender_pet_id: string;
  created_at: string;
};

type OtherPet = PetCardData;

type ToastData = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

function getDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "วันนี้";
  if (d.toDateString() === yesterday.toDateString()) return "เมื่อวาน";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [myPetId,      setMyPetId]      = useState<string | null>(null);
  const [otherPet,     setOtherPet]     = useState<OtherPet | null>(null);
  const [matchMode,    setMatchMode]    = useState<"playdate" | "breeding">("playdate");
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [proposal,     setProposal]     = useState<ProposalData | null>(null);
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [reviewOpen,   setReviewOpen]   = useState(false);
  const [reportOpen,   setReportOpen]   = useState(false);
  const [blockOpen,    setBlockOpen]    = useState(false);
  const [toast,        setToast]        = useState<ToastData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load the latest pending/accepted proposal for this match
  const fetchProposal = useCallback(async () => {
    const { data } = await supabase
      .from("playdate_proposals")
      .select(`
        id, proposer_pet_id, proposed_at, custom_location, note, status,
        spot:playdate_spots(name, district)
      `)
      .eq("match_id", matchId)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1);
    setProposal((data?.[0] as ProposalData | undefined) ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const storedId = localStorage.getItem("pawmate_active_pet_id");
      let myPet: { id: string } | null = null;
      if (storedId) {
        const { data } = await supabase
          .from("pets").select("id")
          .eq("owner_id", user.id).eq("id", storedId).maybeSingle();
        myPet = data;
      }
      if (!myPet) {
        const { data } = await supabase
          .from("pets").select("id")
          .eq("owner_id", user.id).limit(1).maybeSingle();
        myPet = data;
      }

      if (!myPet) { router.replace("/app/matches"); return; }

      const { data: match } = await supabase
        .from("matches")
        .select("id, pet_a_id, pet_b_id, mode")
        .eq("id", matchId)
        .maybeSingle();

      if (!match || (match.pet_a_id !== myPet.id && match.pet_b_id !== myPet.id)) {
        router.replace("/app/matches");
        return;
      }

      const otherId = match.pet_a_id === myPet.id ? match.pet_b_id : match.pet_a_id;
      setMatchMode(match.mode);

      // Block guard: if either side blocked the other, this chat is no longer accessible.
      const blockedIds = await getBlockedPetIds(supabase, myPet.id);
      if (blockedIds.has(otherId)) { router.replace("/app/matches"); return; }

      setMyPetId(myPet.id);

      const { data: other } = await supabase
        .from("pets")
        .select("id, name, species, breed, sex, birth_month, photos, personality_tags, province, district, vaccinated, neutered, bio")
        .eq("id", otherId)
        .single();
      setOtherPet(other);

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, content, sender_pet_id, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Load proposal after initial data is ready
  useEffect(() => {
    if (!loading) fetchProposal();
  }, [loading, fetchProposal]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !myPetId || sending) return;

    setSending(true);
    setInput("");

    const { data: sent } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_pet_id: myPetId, content: text })
      .select("id, content, sender_pet_id, created_at")
      .single();

    if (sent) {
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]
      );
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-app">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
      </div>
    );
  }

  // Group messages by day for date dividers
  const grouped: { dayLabel: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const label = getDayLabel(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.dayLabel === label) last.msgs.push(msg);
    else grouped.push({ dayLabel: label, msgs: [msg] });
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-app">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.push("/app/matches")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-cream"
        >
          <ChevronLeft size={22} />
        </button>
        {otherPet && (
          <>
            <Avatar src={otherPet.photos[0]} name={otherPet.name} size={40} online />
            <span className="flex-1 font-bold tracking-tight2 text-ink">{otherPet.name}</span>
          </>
        )}
        {/* Calendar button — available for both playdate and breeding matches */}
        {myPetId && (
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-soft text-teal-ink transition-colors hover:bg-teal/20"
            title="นัดหมาย"
          >
            <CalendarDays size={18} />
          </button>
        )}

        {/* Overflow menu — review / report / block */}
        {myPetId && otherPet && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream"
              title="ตัวเลือกเพิ่มเติม"
            >
              <MoreVertical size={20} className="text-brown-muted" />
            </button>
            {menuOpen && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl bg-white py-1 shadow-card">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-cream"
                  >
                    <User size={16} className="text-ink-3" /> ดูโปรไฟล์
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setReviewOpen(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-cream"
                  >
                    <Star size={16} className="text-amber" /> ให้คะแนนหลังนัดเจอ
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-cream"
                  >
                    <Flag size={16} className="text-ink-3" /> รายงาน
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setBlockOpen(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-coral hover:bg-cream"
                  >
                    <Ban size={16} /> บล็อก
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Active proposal banner */}
      {proposal && myPetId && (
        <ProposalBanner
          proposal={proposal}
          myPetId={myPetId}
          matchId={matchId}
          onRefetch={fetchProposal}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && otherPet && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Avatar src={otherPet.photos[0]} name={otherPet.name} size={80} />
            <p className="text-sm text-ink-2">
              ทักทาย {otherPet.name} ด้วยข้อความแรกกันเลย 🐾
            </p>
            {/* Opener suggestion chips — fill the input */}
            <div className="flex flex-wrap justify-center gap-2">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setInput(o)}
                  className="rounded-chip border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink-2 shadow-card transition-transform active:scale-95"
                >
                  {o}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="mt-1 flex items-center gap-1.5 rounded-full bg-teal-soft px-4 py-2 text-sm font-bold text-teal-ink transition-transform active:scale-95"
            >
              <CalendarDays size={15} />
              นัดหมาย
            </button>
          </div>
        )}

        {grouped.map(({ dayLabel, msgs }) => (
          <div key={dayLabel}>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-3">{dayLabel}</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            {msgs.map((msg) => {
              const isMine = msg.sender_pet_id === myPetId;
              return (
                <div
                  key={msg.id}
                  className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[72%] px-4 py-2.5 ${
                      isMine
                        ? "rounded-[18px_18px_4px_18px] bg-gradient-cta text-white shadow-cta"
                        : "rounded-[18px_18px_18px_4px] border border-line bg-white text-ink shadow-card"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-right text-[10px] ${isMine ? "text-white/70" : "text-ink-3"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-line bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ..."
            maxLength={2000}
            className="flex-1 rounded-full border-[1.5px] border-line bg-cream px-4 py-2.5 text-sm text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-cta text-white shadow-cta transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Schedule sheet */}
      {scheduleOpen && myPetId && otherPet && (
        <ScheduleSheet
          matchId={matchId}
          myPetId={myPetId}
          province={otherPet.province || "กรุงเทพมหานคร"}
          onClose={() => setScheduleOpen(false)}
          onSuccess={() => {
            setScheduleOpen(false);
            fetchProposal();
          }}
        />
      )}

      {/* Pet profile sheet */}
      {profileOpen && otherPet && (
        <PetProfileSheet
          pet={otherPet}
          mode={matchMode}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* Review modal */}
      {reviewOpen && myPetId && otherPet && (
        <ReviewModal
          matchId={matchId}
          reviewerPetId={myPetId}
          reviewedPetId={otherPet.id}
          petName={otherPet.name}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => {
            setReviewOpen(false);
            setToast({ title: "บันทึกรีวิวแล้ว 🌟" });
          }}
          onDeleted={() => {
            setReviewOpen(false);
            setToast({ title: "ลบรีวิวแล้ว" });
          }}
        />
      )}

      {/* Report sheet */}
      {reportOpen && myPetId && otherPet && (
        <ReportSheet
          reporterPetId={myPetId}
          reportedPetId={otherPet.id}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => {
            setReportOpen(false);
            setToast({
              title: "ส่งรายงานแล้ว",
              subtitle: "ทีมงานจะตรวจสอบภายใน 24 ชม.",
              icon: <Check size={15} className="text-teal" />,
            });
          }}
        />
      )}

      {/* Block confirm */}
      {blockOpen && myPetId && otherPet && (
        <BlockConfirm
          blockerPetId={myPetId}
          blockedPetId={otherPet.id}
          onClose={() => setBlockOpen(false)}
          onBlocked={() => router.push("/app/matches")}
        />
      )}

      {toast && (
        <Toast
          title={toast.title}
          subtitle={toast.subtitle}
          icon={toast.icon}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
