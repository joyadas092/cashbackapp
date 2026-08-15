import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "dark" | "light";

const variantClasses: Record<Variant, string> = {
  dark: "border border-white/10 bg-navy-800/60 backdrop-blur-sm",
  light: "border border-slate-200 bg-white shadow-card",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ className, variant = "dark", ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl2", variantClasses[variant], className)}
      {...props}
    />
  );
}
