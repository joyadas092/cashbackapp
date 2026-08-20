import { Bell } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { AdminSidebar } from "./AdminSidebar";

/**
 * Sticky topbar above the admin content. Renders the sidebar component too,
 * because the sidebar owns the mobile menu trigger that belongs in this bar.
 */
export function AdminTopbar({
  name,
  openTickets,
}: {
  name: string;
  openTickets: number;
}) {
  return (
    <>
      <AdminSidebar />
      <div className="ml-auto flex items-center gap-3">
        <span
          className="relative rounded-lg p-2 text-slate-400"
          title={
            openTickets > 0
              ? `${openTickets} support ticket${openTickets === 1 ? "" : "s"} need attention`
              : "No tickets need attention"
          }
        >
          <Bell size={19} strokeWidth={1.75} />
          {openTickets > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {openTickets > 9 ? "9+" : openTickets}
            </span>
          )}
        </span>

        <div className="flex items-center gap-2.5">
          <Avatar name={name} seed={name} size={34} />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold leading-tight text-slate-900">{name}</div>
            <div className="text-xs text-slate-400">Administrator</div>
          </div>
        </div>
      </div>
    </>
  );
}
