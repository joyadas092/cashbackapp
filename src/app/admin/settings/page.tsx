import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsWorkspace } from "@/components/admin/SettingsWorkspace";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/siteUrl";

/** Postgres version string, or a note if the probe fails. */
async function databaseVersion(): Promise<string> {
  try {
    const rows = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const raw = rows[0]?.version ?? "";
    // "PostgreSQL 16.4 on x86_64…" -> "PostgreSQL 16.4"
    const match = raw.match(/^PostgreSQL\s+[\d.]+/);
    return match ? match[0] : raw.slice(0, 40) || "PostgreSQL";
  } catch {
    return "Unavailable";
  }
}

export default async function AdminSettingsPage() {
  await requireAdminSession("/admin/settings");

  const [settings, database] = await Promise.all([getSettings(), databaseVersion()]);
  const base = siteUrl();

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Platform configuration. Everything here changes real behaviour — nothing on this page is decorative."
      />

      <SettingsWorkspace
        initial={{
          siteName: settings.siteName,
          siteTagline: settings.siteTagline,
          adminEmail: settings.adminEmail,
          supportEmail: settings.supportEmail,
          registrationEnabled: settings.registrationEnabled,
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
          affiliateEnabled: settings.affiliateEnabled,
          referralEnabled: settings.referralEnabled,
          minWithdrawalAmount: settings.minWithdrawalAmount,
          maxWithdrawalAmount: settings.maxWithdrawalAmount,
          panRequiredAboveAmount: settings.panRequiredAboveAmount,
          payoutMethods: settings.payoutMethods,
          seoTitle: settings.seoTitle,
          seoDescription: settings.seoDescription,
          searchIndexingEnabled: settings.searchIndexingEnabled,
        }}
        system={{
          runtime: `Node ${process.version}`,
          environment: process.env.NODE_ENV ?? "development",
          database,
          serverTime: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          siteUrl: base,
          // Presence only — the values themselves are secrets and never leave
          // the server.
          cuelinksConfigured: Boolean(process.env.CUELINKS_API_KEY),
          cuelinksChannel: process.env.CUELINKS_CHANNEL_ID ?? null,
          postbackSecretSet: Boolean(process.env.CUELINKS_POSTBACK_SECRET),
          redisConfigured: Boolean(process.env.REDIS_URL),
          postbackUrl: `${base}/api/webhooks/cuelinks`,
        }}
      />
    </div>
  );
}
