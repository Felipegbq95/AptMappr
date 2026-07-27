"use client";

import { useEffect, useState } from "react";
import { Download, X, MapPinned } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "aptmappr.installDismissed";

/**
 * Shows a small "Install app" banner when the browser offers installation
 * (Chrome/Edge/Android). Dismissal is remembered.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setShow(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[1400] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <MapPinned className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Install AptMappr</div>
          <div className="text-xs text-slate-500">Add it to your home screen for one-tap access.</div>
        </div>
        <button
          onClick={install}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Download className="h-4 w-4" /> Install
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
