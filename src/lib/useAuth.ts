"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface AuthState {
  /** Whether cloud mode (Supabase) is configured at all. */
  cloud: boolean;
  /** Still determining session state. */
  loading: boolean;
  session: Session | null;
  email: string | null;
}

/**
 * Tracks the Supabase auth session. In local mode it immediately resolves to a
 * "signed-in-enough-to-use" state so the app is fully usable with no accounts.
 */
export function useAuth(): AuthState {
  const cloud = isSupabaseConfigured;
  const [loading, setLoading] = useState(cloud);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!cloud) return;
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [cloud]);

  return {
    cloud,
    loading,
    session,
    email: session?.user.email ?? null,
  };
}
