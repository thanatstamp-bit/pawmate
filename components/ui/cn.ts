// Tiny class-name combiner — no dependency (project keeps deps lean).
// Accepts strings, conditionals, arrays, and {class: boolean} maps.
// Does NOT merge conflicting Tailwind classes (no tailwind-merge); order the
// caller's classes so later wins, or override via the `className` prop which
// is always appended last by the ui primitives.
type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) out.push(inner);
    } else if (typeof input === "object") {
      for (const [key, val] of Object.entries(input)) {
        if (val) out.push(key);
      }
    }
  }
  return out.join(" ");
}
