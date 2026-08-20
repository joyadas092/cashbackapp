import Link from "next/link";
import { Wrench } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-xl2 border border-slate-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Wrench size={26} strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Back shortly</h1>
        <p className="mt-2 text-slate-600">{settings.maintenanceMessage}</p>
        <p className="mt-6 text-sm text-slate-500">
          Your balance and earnings are safe — nothing is affected while we work.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Admin sign in
        </Link>
      </div>
    </div>
  );
}
