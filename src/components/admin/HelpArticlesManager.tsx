"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";

export interface AdminHelpArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  isFaq: boolean;
  isPopular: boolean;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500";
const label = "block text-xs font-medium uppercase tracking-wide text-slate-500";

const EMPTY: AdminHelpArticle = {
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  category: "General",
  isFaq: false,
  isPopular: false,
  isPublished: true,
  sortOrder: 0,
  viewCount: 0,
};

/** Lowercase, hyphenated, no punctuation — matches the server's slug rule. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function HelpArticlesManager({ articles }: { articles: AdminHelpArticle[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<AdminHelpArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const isNew = draft?.id === "";

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      title: draft.title,
      slug: draft.slug || slugify(draft.title),
      excerpt: draft.excerpt.trim() || null,
      body: draft.body,
      category: draft.category,
      isFaq: draft.isFaq,
      isPopular: draft.isPopular,
      isPublished: draft.isPublished,
      sortOrder: draft.sortOrder,
    };

    const res = await fetch(
      isNew ? "/api/admin/help-articles" : `/api/admin/help-articles/${draft.id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not save that article." });
      return;
    }

    setDraft(null);
    setMessage({ kind: "ok", text: isNew ? "Article created." : "Article saved." });
    router.refresh();
  }

  async function remove(article: AdminHelpArticle) {
    setDeletingId(article.id);
    setMessage(null);

    const res = await fetch(`/api/admin/help-articles/${article.id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage({ kind: "err", text: body.error ?? "Could not delete that article." });
      return;
    }
    setMessage({ kind: "ok", text: `Deleted "${article.title}".` });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Help Articles &amp; FAQs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Articles show in the Help Center; FAQs show in the FAQs view. Popular ones are listed on
            the Help home page.
          </p>
        </div>
        <button
          onClick={() => setDraft({ ...EMPTY })}
          className="flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Article
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-cashlime-200 bg-cashlime-50 text-cashlime-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {draft && (
        <section className="rounded-xl2 border border-violet-200 bg-violet-50/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{isNew ? "New article" : "Edit article"}</h2>
            <button
              onClick={() => setDraft(null)}
              aria-label="Close editor"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Title</label>
              <input
                className={`${field} mt-1.5`}
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setDraft({
                    ...draft,
                    title,
                    // Only auto-fill the slug for new articles — changing an
                    // existing one would break links already shared.
                    slug: isNew ? slugify(title) : draft.slug,
                  });
                }}
                placeholder="How does cashback work?"
              />
            </div>

            <div>
              <label className={label}>Slug (URL)</label>
              <input
                className={`${field} mt-1.5`}
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder="how-does-cashback-work"
              />
            </div>

            <div>
              <label className={label}>Category</label>
              <input
                className={`${field} mt-1.5`}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Cashback"
              />
            </div>

            <div>
              <label className={label}>Sort order</label>
              <input
                className={`${field} mt-1.5`}
                value={String(draft.sortOrder)}
                onChange={(e) =>
                  setDraft({ ...draft, sortOrder: Number(e.target.value.replace(/\D/g, "")) || 0 })
                }
                inputMode="numeric"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={label}>Short summary</label>
              <input
                className={`${field} mt-1.5`}
                value={draft.excerpt}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                placeholder="Shown under the title in lists. Optional."
              />
            </div>

            <div className="sm:col-span-2">
              <label className={label}>Body</label>
              <textarea
                className={`${field} mt-1.5 min-h-[180px] rounded-lg`}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Plain text. Leave a blank line between paragraphs."
              />
              <p className="mt-1 text-xs text-slate-400">
                Rendered as plain paragraphs, never as HTML.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 sm:col-span-2">
              {(
                [
                  ["isFaq", "Show as FAQ"],
                  ["isPopular", "Popular topic"],
                  ["isPublished", "Published"],
                ] as const
              ).map(([key, text]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 bg-white"
                  />
                  {text}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : isNew ? "Create Article" : "Save Changes"}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <div className="overflow-x-auto rounded-xl2 border border-slate-200">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No articles yet.
                </td>
              </tr>
            )}
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{article.title}</div>
                  <div className="font-mono text-xs text-slate-400">/{article.slug}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{article.category}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {article.isFaq ? "FAQ" : "Article"}
                    </span>
                    {article.isPopular && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-700">
                        Popular
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{article.viewCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      article.isPublished
                        ? "rounded-full bg-cashlime-500/15 px-2.5 py-1 text-xs font-semibold text-cashlime-700"
                        : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {article.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDraft({ ...article })}
                      title="Edit"
                      className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
                    >
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => remove(article)}
                      disabled={deletingId === article.id}
                      title="Delete"
                      className="rounded-lg border border-slate-300 p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
