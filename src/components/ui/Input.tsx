import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full border border-white/15 bg-navy-900/80 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-violet-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
