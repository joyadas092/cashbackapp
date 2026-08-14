export function CashbackBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-cashlime-500/15 px-3 py-1 text-xs font-semibold text-cashlime-400">
      {text}
    </span>
  );
}
