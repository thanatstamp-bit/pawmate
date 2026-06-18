"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CareDueBadge() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const storedId = localStorage.getItem("pawmate_active_pet_id");
      let petId: string | null = storedId;

      if (!petId) {
        const { data } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        petId = data?.id ?? null;
      }

      if (!petId) return;

      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const in30Str = in30.toISOString().slice(0, 10);

      const { count: dueCount } = await supabase
        .from("health_records")
        .select("id", { count: "exact", head: true })
        .eq("pet_id", petId)
        .not("next_due_date", "is", null)
        .gte("next_due_date", today)
        .lte("next_due_date", in30Str);

      setCount(dueCount ?? 0);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber px-[3px] text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
