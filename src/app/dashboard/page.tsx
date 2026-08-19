import { redirect } from "next/navigation";

/**
 * The dashboard overview is gone — My Activity already carries the same wallet
 * figures plus the full breakdown behind them, so a separate summary page was
 * one extra click to the same numbers.
 *
 * This stays as a redirect rather than being deleted: /dashboard is the default
 * post-login destination and is linked from plenty of places, including the
 * non-admin fallback in adminAuth and middleware.
 */
export default function DashboardIndex() {
  redirect("/dashboard/activity");
}
