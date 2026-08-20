"use client";

import { useState } from "react";
import { Eye, FileText, Pencil, Plus } from "lucide-react";
import { AdminBadge, AdminEmpty, AdminTableWrap, AdminTh } from "@/components/admin/ui";
import { CmsPageEditor, EMPTY_CMS_PAGE, type CmsPageDraft } from "./CmsPageEditor";

export interface CmsPageRow extends CmsPageDraft {
  views: number;
  updatedAt: string;
  updatedByName: string | null;
}

const TYPE_TONES: Record<string, { label: string; tone: string }> = {
  STATIC: { label: "Static Page", tone: "bg-violet-50 text-violet-700" },
  CUSTOM: { label: "Custom Page", tone: "bg-amber-50 text-amber-700" },
  LANDING: { label: "Landing Page", tone: "bg-sky-50 text-sky-700" },
};

const STATUS_TONES: Record<string, { label: string; tone: string }> = {
  PUBLISHED: { label: "Published", tone: "bg-cashlime-50 text-cashlime-700" },
  DRAFT: { label: "Draft", tone: "bg-amber-50 text-amber-700" },
  ARCHIVED: { label: "Archived", tone: "bg-slate-100 text-slate-500" },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CmsPagesManager({ pages }: { pages: CmsPageRow[] }) {
  const [draft, setDraft] = useState<CmsPageDraft | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-5 pt-5">
        <h2 className="text-base font-bold text-slate-900">All CMS Pages</h2>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY_CMS_PAGE })}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add New Page
        </button>
      </div>

      <div className="mt-4">
        {pages.length === 0 ? (
          <AdminEmpty
            title="No pages match these filters"
            body="Create one — published pages appear at /pages/your-slug."
          />
        ) : (
          <AdminTableWrap minWidth={1000}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>Page</AdminTh>
                <AdminTh>Type</AdminTh>
                <AdminTh>Slug</AdminTh>
                <AdminTh align="right">Views</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Last Updated</AdminTh>
                <AdminTh>Actions</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((page) => {
                const type = TYPE_TONES[page.type] ?? {
                  label: page.type,
                  tone: "bg-slate-100 text-slate-600",
                };
                const status = STATUS_TONES[page.status] ?? {
                  label: page.status,
                  tone: "bg-slate-100 text-slate-600",
                };

                return (
                  <tr key={page.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <FileText size={15} strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">
                            {page.title}
                          </span>
                          {page.excerpt && (
                            <span className="block truncate text-xs text-slate-400">
                              {page.excerpt}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge label={type.label} tone={type.tone} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">/{page.slug}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{page.views}</td>
                    <td className="px-5 py-3">
                      <AdminBadge label={status.label} tone={status.tone} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="block text-slate-500">{formatDateTime(page.updatedAt)}</span>
                      {page.updatedByName && (
                        <span className="block text-xs text-slate-400">
                          by {page.updatedByName}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {page.status === "PUBLISHED" && (
                          <a
                            href={`/pages/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View page"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-violet-300 hover:text-violet-700"
                          >
                            <Eye size={14} strokeWidth={2} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setDraft({ ...page })}
                          title="Edit page"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-violet-300 hover:text-violet-700"
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        )}
      </div>

      {draft && <CmsPageEditor draft={draft} onClose={() => setDraft(null)} />}
    </>
  );
}
