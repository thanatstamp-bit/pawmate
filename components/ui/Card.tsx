import { cn } from "./cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** card = 24px radius (heroes), panel = 18px (standard) */
  radius?: "card" | "panel";
  /** Adds active:scale tap feedback (use for tappable cards) */
  interactive?: boolean;
  as?: "div" | "section" | "article";
}

export default function Card({
  radius = "panel",
  interactive = false,
  as: Tag = "div",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-white shadow-card",
        radius === "card" ? "rounded-card" : "rounded-panel",
        interactive && "transition-transform active:scale-[.98]",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
