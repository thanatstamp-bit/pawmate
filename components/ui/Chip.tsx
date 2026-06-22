import { cn } from "./cn";

type Tone = "coral" | "teal" | "amber" | "rose" | "blue" | "neutral";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Renders a selectable filter chip (1.5px border, active state) */
  selectable?: boolean;
  active?: boolean;
}

// Soft tinted chip (on cards). Rounded rectangle, NOT a full pill.
const softTones: Record<Tone, string> = {
  coral: "bg-coral-soft text-coral-ink",
  teal: "bg-teal-soft text-teal-ink",
  amber: "bg-amber-soft text-amber-deep",
  rose: "bg-rose-soft text-rose-ink",
  blue: "bg-blue-soft text-blue-ink",
  neutral: "bg-cream text-ink-2",
};

export default function Chip({
  tone = "neutral",
  selectable = false,
  active = false,
  className,
  children,
  ...props
}: ChipProps) {
  if (selectable) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-chip border-[1.5px] px-4 py-2 text-[13px] font-semibold transition-colors",
          active
            ? "border-coral/40 bg-coral-soft text-coral-ink"
            : "border-line bg-[#FBF7F3] text-ink-3",
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1 text-[11.5px] font-semibold",
        softTones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
