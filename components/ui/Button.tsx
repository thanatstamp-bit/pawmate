import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Adds the pulsing glow + diagonal sheen to a primary CTA */
  glow?: boolean;
  /** Optional translucent count pill on the right (e.g. active filter count) */
  count?: number;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-bold tracking-tight2 transition-transform active:scale-[.97] disabled:opacity-50 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-gradient-cta text-white shadow-cta",
  secondary: "border-2 border-black/10 bg-white text-ink-2 hover:border-coral/40 hover:text-ink",
  ghost: "bg-coral/10 text-coral hover:bg-coral/15",
  danger: "bg-rose text-white hover:bg-rose-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-chip px-4 text-sm",
  md: "h-12 rounded-2xl px-5 text-[15px]",
  lg: "h-14 rounded-2xl px-6 text-[17px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  glow = false,
  count,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const useGlow = glow && variant === "primary";
  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        useGlow && "cta-sheen animate-cta-pulse",
        className,
      )}
      {...props}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold tabular-nums backdrop-blur-sm">
          {count}
        </span>
      )}
    </button>
  );
}
