"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings, Wallet } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { formatInr } from "@/lib/utils";

export function UserMenu({
  name,
  balance,
  onSignOut,
}: {
  name: string;
  balance: number;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
      >
        <Avatar name={name} size={32} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs font-semibold text-white">Hi, {name.split(" ")[0]}</span>
          <span className="block text-[11px] text-cashlime-400">{formatInr(balance)}</span>
        </span>
        <ChevronDown size={15} className="text-white/50" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">{name}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              Balance <span className="font-semibold text-cashlime-700">{formatInr(balance)}</span>
            </div>
          </div>
          <nav className="py-1">
            {[
              { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
              { href: "/dashboard", icon: Wallet, label: "My Wallet" },
              { href: "/dashboard/profile", icon: Settings, label: "Settings" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <item.icon size={16} strokeWidth={1.75} className="text-slate-400" />
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={onSignOut} className="border-t border-slate-100">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} strokeWidth={1.75} />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
