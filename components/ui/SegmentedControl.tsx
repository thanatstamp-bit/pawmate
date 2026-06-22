import { cn } from "./cn";

type Tone = "coral" | "teal" | "amber";

interface Segment<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Active-thumb color (defaults to white thumb / coral label) */
  tone?: Tone;
  className?: string;
}

const activeThumb: Record<Tone, string> = {
  coral: "bg-white text-coral-ink",
  teal: "bg-teal text-white",
  amber: "bg-amber text-white",
};

// iOS-style segmented control: pill track + sliding active thumb.
export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  tone = "coral",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-[5px] rounded-chip bg-[#F4EEE9] p-[5px]",
        className,
      )}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            disabled={seg.disabled}
            onClick={() => onChange(seg.value)}
            className={cn(
              "flex-1 rounded-[11px] py-2 text-center text-[13.5px] font-bold tracking-tight2 transition-all",
              active
                ? cn(activeThumb[tone], "shadow-card")
                : "text-ink-3 disabled:opacity-40",
            )}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
