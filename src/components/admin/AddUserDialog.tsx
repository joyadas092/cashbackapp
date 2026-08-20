"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const field =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400";
const label = "text-sm font-medium text-slate-700";

export function AddUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setError(null);
    setCreated(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create that user.");
      return;
    }

    setCreated(email);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
      >
        <Plus size={15} strokeWidth={2.5} />
        Add User
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-user-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl2 border border-slate-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="add-user-title" className="text-lg font-bold text-slate-900">
                Add User
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {created ? (
              <div className="mt-4">
                <p className="rounded-xl border border-cashlime-200 bg-cashlime-50 px-4 py-3 text-sm text-cashlime-700">
                  Created <strong>{created}</strong>. Give them the password you set — this app
                  doesn&apos;t send email yet, so nothing was delivered to them automatically.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
                  >
                    Add another
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3.5">
                <div>
                  <label htmlFor="au-name" className={label}>
                    Full name
                  </label>
                  <input
                    id="au-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className={field}
                  />
                </div>

                <div>
                  <label htmlFor="au-email" className={label}>
                    Email
                  </label>
                  <input
                    id="au-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={field}
                  />
                </div>

                <div>
                  <label htmlFor="au-phone" className={label}>
                    Mobile <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="au-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="10-digit mobile number"
                    className={field}
                  />
                </div>

                <div>
                  <label htmlFor="au-password" className={label}>
                    Temporary password
                  </label>
                  <input
                    id="au-password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className={field}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    At least 8 characters. Shown in plain text because you have to pass it on
                    yourself — ask them to change it at first login.
                  </p>
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
                >
                  {busy ? "Creating..." : "Create User"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
