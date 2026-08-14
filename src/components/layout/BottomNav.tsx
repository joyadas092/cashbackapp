import Link from "next/link";

const ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/stores", label: "Stores", icon: "🛍️" },
  { href: "/stores?featured=1", label: "Earn", icon: "💰" },
  { href: "/dashboard", label: "Activity", icon: "📊" },
  { href: "/dashboard", label: "Profile", icon: "👤" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-navy-950/95 backdrop-blur-md sm:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-white/60"
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
