import { cn } from "./cn";

type Tone = "coral" | "amber" | "teal" | "rose";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  coral: "bg-coral text-white",
  amber: "bg-amber text-white",
  teal: "bg-teal text-white",
  rose: "bg-rose text-white",
};

// Small solid count / status badge — soft rounded rectangle, tight tracking.
export default function Badge({
  tone = "coral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-[3px] text-[10px] font-bold tracking-wide tabular-nums",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
