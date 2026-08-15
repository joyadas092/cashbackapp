import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "dark" | "light";

const variantClasses: Record<Variant, string> = {
  dark: "border-white/15 bg-navy-900/80 text-white placeholder:text-white/40",
  light: "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: Variant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "dark", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full border px-5 py-3 text-sm outline-none focus:border-violet-500",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
