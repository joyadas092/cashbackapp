import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-white/60">{message}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref}>
          <Button variant="primary">{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}
