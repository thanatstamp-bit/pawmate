import { cn } from "./cn";

interface AvatarProps {
  src?: string | null;
  /** Fallback initial shown when there is no photo */
  name?: string | null;
  size?: number;
  /** Rounded-square (rounded-panel) instead of a circle */
  square?: boolean;
  /** Teal online status dot with cream ring */
  online?: boolean;
  className?: string;
}

// Avatar with a coral-gradient fallback (initial) when no photo is set.
export default function Avatar({
  src,
  name,
  size = 48,
  square = false,
  online = false,
  className,
}: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? "🐾").toUpperCase();
  const shape = square ? "rounded-panel" : "rounded-full";
  // The root carries the shape too so any ring/border passed via className
  // follows the circle/rounded-rect instead of drawing a square around it.
  return (
    <div className={cn("relative shrink-0", shape, className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ""}
          className={cn("h-full w-full object-cover", shape)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-avatar font-bold text-white",
            shape,
          )}
          style={{ fontSize: size * 0.42 }}
        >
          {initial}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-teal ring-2 ring-cream"
          style={{ width: size * 0.26, height: size * 0.26 }}
        />
      )}
    </div>
  );
}
