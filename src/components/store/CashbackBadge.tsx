export function CashbackBadge({
  text,
  variant = "dark",
}: {
  text: string;
  variant?: "dark" | "light";
}) {
  return (
    <span
      className={
        variant === "light"
          ? "inline-flex items-center rounded-full bg-cashlime-50 px-3 py-1 text-xs font-semibold text-cashlime-700"
          : "inline-flex items-center rounded-full bg-cashlime-500/15 px-3 py-1 text-xs font-semibold text-cashlime-400"
      }
    >
      {text}
    </span>
  );
}
