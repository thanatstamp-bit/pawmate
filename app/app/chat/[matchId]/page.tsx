"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  sender_pet_id: string;
  created_at: string;
};

type OtherPet = {
  id: string;
  name: string;
  photos: string[];
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

  const [myPetId, setMyPetId] = useState<string | null>(null);
  const [otherPet, setOtherPet] = useState<OtherPet | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myPet } = await supabase
        .from("pets")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!myPet) { router.replace("/app/matches"); return; }

      // Load match and verify user is part of it
      const { data: match } = await supabase
        .from("matches")
        .select("id, pet_a_id, pet_b_id")
        .eq("id", matchId)
        .maybeSingle();

      if (!match || (match.pet_a_id !== myPet.id && match.pet_b_id !== myPet.id)) {
        router.replace("/app/matches");
        return;
      }

      setMyPetId(myPet.id);

      // Load the other pet
      const otherId =
        match.pet_a_id === myPet.id ? match.pet_b_id : match.pet_a_id;
      const { data: other } = await supabase
        .from("pets")
        .select("id, name, photos")
        .eq("id", otherId)
        .single();
      setOtherPet(other);

      // Load existing messages
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

  // Realtime subscription for new messages
  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (our own send is already added optimistically)
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
      .insert({
        match_id: matchId,
        sender_pet_id: myPetId,
        content: text,
      })
      .select("id, content, sender_pet_id, created_at")
      .single();

    if (sent) {
      // Add optimistically — realtime will dedup if it also fires
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
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
      </div>
    );
  }

  // Group messages by day for date dividers
  const grouped: { dayLabel: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const label = getDayLabel(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.dayLabel === label) {
      last.msgs.push(msg);
    } else {
      grouped.push({ dayLabel: label, msgs: [msg] });
    }
  }

  return (
    <div className="flex h-screen flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/app/matches")}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream"
        >
          <ChevronLeft size={22} />
        </button>
        {otherPet && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={otherPet.photos[0]}
              alt={otherPet.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-bold text-brown">{otherPet.name}</span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && otherPet && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={otherPet.photos[0]}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
            <p className="text-sm text-brown-muted">
              ลองชวนนัดเดทที่สวนใกล้ๆ ดูสิ 🐾
            </p>
          </div>
        )}

        {grouped.map(({ dayLabel, msgs }) => (
          <div key={dayLabel}>
            {/* Day divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/8" />
              <span className="text-xs text-brown-muted">{dayLabel}</span>
              <div className="h-px flex-1 bg-black/8" />
            </div>

            {msgs.map((msg) => {
              const isMine = msg.sender_pet_id === myPetId;
              return (
                <div
                  key={msg.id}
                  className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "rounded-tr-sm bg-coral text-white"
                        : "rounded-tl-sm bg-white shadow-card text-brown"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isMine ? "text-white/70" : "text-brown-muted"
                      }`}
                    >
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
      <div className="border-t border-black/5 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ..."
            maxLength={2000}
            className="flex-1 rounded-full border border-black/10 bg-cream px-4 py-2.5 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral text-white transition-colors disabled:opacity-40 hover:bg-coral-dark"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
