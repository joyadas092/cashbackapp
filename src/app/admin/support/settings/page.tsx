import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { SupportSettingsEditor } from "@/components/admin/SupportSettingsEditor";

export default async function AdminSupportSettingsPage() {
  await requireAdminSession("/admin/support/settings");

  const settings = await prisma.supportSettings.findFirst({ where: { isActive: true } });

  return (
    <SupportSettingsEditor
      initial={{
        email: settings?.email ?? "",
        phone: settings?.phone ?? "",
        whatsapp: settings?.whatsapp ?? "",
        hours: settings?.hours ?? "",
        liveChatEnabled: settings?.liveChatEnabled ?? false,
        liveChatNote: settings?.liveChatNote ?? "",
        responseNote: settings?.responseNote ?? "",
      }}
    />
  );
}
