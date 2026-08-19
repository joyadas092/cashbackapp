"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const field =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white";
const label = "text-sm font-medium text-slate-700";

function strengthOf(password: string): { score: number; label: string; tone: string } {
  if (password.length === 0) return { score: 0, label: "", tone: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", tone: "bg-rose-500 text-rose-600" };
  if (score === 3) return { score, label: "Fair", tone: "bg-amber-500 text-amber-600" };
  if (score === 4) return { score, label: "Good", tone: "bg-sky-500 text-sky-600" };
  return { score, label: "Strong", tone: "bg-cashlime-500 text-cashlime-700" };
}

export function SecurityForm({ lastChangedAt }: { lastChangedAt: string | null }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const strength = strengthOf(newPassword);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Checked here so a typo in the confirmation never reaches the server as a
    // password change.
    if (newPassword !== confirmPassword) {
      setMessage({ kind: "err", text: "The two new passwords don't match." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not change your password." });
      return;
    }

    setMessage({ kind: "ok", text: "Password changed." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <section
      id="security"
      className="scroll-mt-24 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <ShieldCheck size={19} strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Account &amp; Security</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {lastChangedAt
              ? `Password last changed on ${lastChangedAt}.`
              : "Change your password to keep your account secure."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="pw-current" className={label}>
            Current Password
          </label>
          <div className="relative">
            <input
              id="pw-current"
              type={reveal ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={field}
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide passwords" : "Show passwords"}
              className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {reveal ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="pw-new" className={label}>
            New Password
          </label>
          <input
            id="pw-new"
            type={reveal ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={field}
          />
          {newPassword.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1 flex-1 gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full ${
                      i <= strength.score ? strength.tone.split(" ")[0] : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-semibold ${strength.tone.split(" ")[1]}`}>
                {strength.label}
              </span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="pw-confirm" className={label}>
            Confirm New Password
          </label>
          <input
            id="pw-confirm"
            type={reveal ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className={field}
          />
          {mismatch && <p className="mt-1 text-xs text-red-600">These don&apos;t match.</p>}
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving || mismatch || newPassword.length < 8}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Changing..." : "Change Password"}
          </button>
          {message && (
            <span
              className={`text-sm font-medium ${
                message.kind === "ok" ? "text-cashlime-700" : "text-red-600"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
