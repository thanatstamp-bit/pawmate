import { cn } from "./cn";

type Tone = "coral" | "teal" | "amber" | "rose" | "blue" | "neutral";

interface IconTileProps {
  tone?: Tone;
  size?: number;
  /** Radius class (default rounded-chip). Pass e.g. "rounded-full" / "rounded-xl". */
  rounded?: string;
  className?: string;
  children: React.ReactNode;
}

// Soft-tinted rounded square holding a stroke icon. The matching ink text
// color is set so a lucide icon with stroke="currentColor" picks it up.
const tones: Record<Tone, string> = {
  coral: "bg-coral-soft text-coral",
  teal: "bg-teal-soft text-teal-ink",
  amber: "bg-amber-soft text-amber-deep",
  rose: "bg-rose-soft text-rose-ink",
  blue: "bg-blue-soft text-blue-ink",
  neutral: "bg-cream text-ink-2",
};

export default function IconTile({
  tone = "coral",
  size = 46,
  rounded = "rounded-chip",
  className,
  children,
}: IconTileProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        rounded,
        tones[tone],
        className,
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}
