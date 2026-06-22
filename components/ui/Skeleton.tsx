import { cn } from "./cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: string;
}

// Shimmer placeholder block. Set width/height via className.
export default function Skeleton({
  rounded = "rounded-panel",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("skeleton animate-shimmer", rounded, className)}
      {...props}
    />
  );
}
