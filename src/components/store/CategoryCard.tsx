import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function CategoryCard({ name, slug }: { name: string; slug: string }) {
  return (
    <Link href={`/stores?category=${slug}`}>
      <Card className="px-5 py-4 text-center text-sm font-medium text-white/80 transition-colors hover:border-cyan-400/50 hover:text-cyan-300">
        {name}
      </Card>
    </Link>
  );
}
