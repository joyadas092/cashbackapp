import Link from "next/link";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/shared/Pagination";

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdminSession("/admin/users");

  const q = searchParams.q?.trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, riskStatus: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <form className="mt-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search by name or email" />
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl2 border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-violet-600 hover:underline">
                    {u.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.role}</td>
                <td className="px-4 py-3 text-slate-600">{u.riskStatus}</td>
                <td className="px-4 py-3 text-slate-400">
                  {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        basePath="/admin/users"
        searchParams={{ q }}
      />
    </div>
  );
}
