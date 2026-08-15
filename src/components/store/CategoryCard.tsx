import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function CategoryCard({ name, slug }: { name: string; slug: string }) {
  return (
    <Link href={`/stores?category=${slug}`}>
      <Card
        variant="light"
        className="px-5 py-4 text-center text-sm font-medium text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700"
      >
        {name}
      </Card>
    </Link>
  );
}
