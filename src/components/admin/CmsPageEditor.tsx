"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2, X } from "lucide-react";

export interface CmsPageDraft {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  type: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  showInFooter: boolean;
  sortOrder: number;
}

export const EMPTY_CMS_PAGE: CmsPageDraft = {
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  type: "STATIC",
  status: "DRAFT",
  seoTitle: "",
  seoDescription: "",
  showInFooter: false,
  sortOrder: 0,
};

const field =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400";
const label = "text-xs font-medium uppercase tracking-wide text-slate-500";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function CmsPageEditor({
  draft,
  onClose,
}: {
  draft: CmsPageDraft;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(draft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = value.id === "";

  function set<K extends keyof CmsPageDraft>(key: K, next: CmsPageDraft[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function save() {
    setSaving(true);
    setError(null);

    const res = await fetch(isNew ? "/api/admin/cms-pages" : `/api/admin/cms-pages/${value.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: value.title,
        slug: value.slug || slugify(value.title),
        excerpt: value.excerpt.trim() || null,
        body: value.body,
        type: value.type,
        status: value.status,
        seoTitle: value.seoTitle.trim() || null,
        seoDescription: value.seoDescription.trim() || null,
        showInFooter: value.showInFooter,
        sortOrder: value.sortOrder,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(payload.error ?? "Could not save that page.");
      return;
    }
    onClose();
    router.refresh();
  }

  async function remove() {
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/admin/cms-pages/${value.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Could not delete that page.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-3xl rounded-xl2 border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {isNew ? "New page" : `Edit “${draft.title}”`}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && value.status === "PUBLISHED" && (
              <a
                href={`/pages/${value.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline"
              >
                View
                <ExternalLink size={13} strokeWidth={2} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Title</label>
            <input
              className={field}
              value={value.title}
              onChange={(e) => {
                const title = e.target.value;
                setValue((current) => ({
                  ...current,
                  title,
                  // Only auto-fill for new pages — changing a live page's slug
                  // breaks every link already shared to it.
                  slug: isNew ? slugify(title) : current.slug,
                }));
              }}
              placeholder="Terms & Conditions"
            />
          </div>

          <div>
            <label className={label}>Slug (URL)</label>
            <input
              className={field}
              value={value.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="terms-conditions"
            />
            <p className="mt-1 text-xs text-slate-400">
              Published at <code className="text-violet-700">/pages/{value.slug || "…"}</code>
            </p>
          </div>

          <div>
            <label className={label}>Type</label>
            <select
              className={field}
              value={value.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="STATIC">Static Page</option>
              <option value="CUSTOM">Custom Page</option>
              <option value="LANDING">Landing Page</option>
            </select>
          </div>

          <div>
            <label className={label}>Status</label>
            <select
              className={field}
              value={value.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Only published pages are reachable — drafts and archived pages 404.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Short summary</label>
            <input
              className={field}
              value={value.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Shown under the title and in listings. Optional."
            />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Body</label>
            <textarea
              className={`${field} min-h-[220px]`}
              value={value.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Plain text. Leave a blank line between paragraphs."
            />
            <p className="mt-1 text-xs text-slate-400">
              Rendered as plain paragraphs, never as HTML.
            </p>
          </div>

          <div>
            <label className={label}>SEO title</label>
            <input
              className={field}
              value={value.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="Falls back to the page title"
            />
          </div>

          <div>
            <label className={label}>SEO description</label>
            <input
              className={field}
              value={value.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              placeholder="Falls back to the summary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value.showInFooter}
                onChange={(e) => set("showInFooter", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Link from the site footer
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              Footer order
              <input
                className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                value={String(value.sortOrder)}
                onChange={(e) => set("sortOrder", Number(e.target.value.replace(/\D/g, "")) || 0)}
                inputMode="numeric"
              />
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : isNew ? "Create Page" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 size={14} strokeWidth={2} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
