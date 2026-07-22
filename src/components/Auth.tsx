"use client";

import { useState } from "react";
import { MapPinned, LogOut, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

/** Full-screen sign-in shown only when Supabase (cloud mode) is configured. */
export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function google() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <MapPinned className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">AptMappr</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to sync your apartment hunt across devices.
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            Check your inbox — we sent a magic sign-in link to <strong>{email}</strong>.
          </p>
        ) : (
          <>
            <button
              onClick={google}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Continue with Google
            </button>
            <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
            </div>
            <form onSubmit={sendMagicLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Email me a magic link
              </button>
            </form>
            {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export function SignOutButton({ email }: { email: string | null }) {
  async function signOut() {
    await getSupabase()?.auth.signOut();
  }
  return (
    <button
      onClick={signOut}
      title={email ? `Sign out ${email}` : "Sign out"}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
    >
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  );
}
