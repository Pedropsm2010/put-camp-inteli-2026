import { Plane } from "lucide-react";

export function BrandMark({
  variant = "light",
  size = "md",
}: {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-14" : size === "sm" ? "size-9" : "size-11";
  const title = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const sub = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} grid place-items-center rounded-2xl bg-gradient-yellow shadow-glow-yellow`}
      >
        <Plane className="size-1/2 text-navy-deep -rotate-45" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className={`${title} font-extrabold ${variant === "light" ? "text-white" : "text-navy-deep"}`}>
          Azul Talent Gupy
        </div>
        <div className={`${sub} font-semibold tracking-[0.18em] uppercase ${variant === "light" ? "text-azul-yellow" : "text-muted-foreground"}`}>
          Recrutamento IA
        </div>
      </div>
    </div>
  );
}
