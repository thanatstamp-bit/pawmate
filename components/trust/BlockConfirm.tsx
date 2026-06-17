"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  blockerPetId: string;
  blockedPetId: string;
  onClose: () => void;
  onBlocked: () => void;
}

// Confirm dialog for blocking a pet. Inserts a block row (never deletes data);
// the reusable getBlockedPetIds filter then hides both pets from each other.
export default function BlockConfirm({
  blockerPetId,
  blockedPetId,
  onClose,
  onBlocked,
}: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  async function block() {
    if (saving) return;
    setSaving(true);
    // Ignore unique-violation if already blocked — the end state is the same.
    await supabase
      .from("blocks")
      .insert({ blocker_pet_id: blockerPetId, blocked_pet_id: blockedPetId });
    setSaving(false);
    onBlocked();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-[320px] rounded-card bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-rose/10">
          <Ban size={24} className="text-rose" />
        </div>
        <h3 className="text-lg font-bold text-brown">บล็อกน้องนี้?</h3>
        <p className="mt-2 text-sm text-brown-muted">
          ทั้งสองฝ่ายจะไม่เห็นกันอีก และการสนทนาจะถูกซ่อน
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border-2 border-black/10 py-2.5 font-bold text-brown-muted"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={block}
            disabled={saving}
            className="flex-1 rounded-full bg-rose py-2.5 font-bold text-white disabled:opacity-60"
          >
            {saving ? "กำลังบล็อก..." : "บล็อก"}
          </button>
        </div>
      </div>
    </div>
  );
}
