"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarSubItem {
  href: string;
  label: string;
  /** Matched against the current tab query so the right child highlights. */
  tab?: string;
}

/**
 * A nav row that expands into sub-items.
 *
 * Starts open whenever the group's own section is the current one — landing on
 * a child shouldn't hide the list that child belongs to. Otherwise it remembers
 * whatever the user last toggled it to.
 */
export function SidebarNavGroup({
  href,
  icon: Icon,
  label,
  items,
  sectionActive,
  activeTab,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  items: SidebarSubItem[];
  sectionActive: boolean;
  activeTab?: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(sectionActive);

  return (
    <div>
      <div
        className={cn(
          "flex items-center rounded-lg border-l-2 pr-1 transition-colors",
          sectionActive
            ? "border-violet-400 bg-violet-500/15 text-white"
            : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
        )}
      >
        <Link
          href={href}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium"
        >
          <Icon size={18} strokeWidth={1.75} />
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          className="rounded-md p-1.5 text-current opacity-70 hover:bg-white/10 hover:opacity-100"
        >
          <ChevronDown
            size={15}
            strokeWidth={2}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <ul className="mt-1 space-y-0.5 pl-6">
          {items.map((item) => {
            const isActive = sectionActive && activeTab === item.tab;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive ? "text-white" : "text-white/45 hover:text-white/80"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      isActive ? "bg-violet-400" : "bg-white/20"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
