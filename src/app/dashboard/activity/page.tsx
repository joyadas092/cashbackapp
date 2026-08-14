import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export default async function ActivityPage() {
  const session = await auth();
  // Layout also guards /dashboard/**, but every page under it double-guards
  // too — see dashboard/page.tsx's comment on the parallel layout/page fetch race.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/activity");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Recent Activity</h1>
      <p className="mt-1 text-white/60">Your clicks, cashback, profit link, and referral history.</p>
      <div className="mt-6">
        <ActivityFeed />
      </div>
    </div>
  );
}
