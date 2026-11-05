// Optional accounts through Supabase Auth (email magic link or Google). Without
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY the site runs signed out only,
// which is the free tier.
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const URL_ = import.meta.env.VITE_SUPABASE_URL ?? "";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const authEnabled = !!(URL_ && KEY);

// Implicit flow: the emailed link carries the session itself, so it works in
// whichever browser or device opens it. PKCE links only work in the browser
// that asked for them, and people often open their email somewhere else.
let client: SupabaseClient | null = null;
const supa = () => (client ??= createClient(URL_, KEY, { auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true } }));

/** A sign-in link that failed comes back as #error=...&error_code=...; read it once at load. */
function readLinkError(): "expired" | "failed" | null {
  const q = new URLSearchParams(location.hash.slice(1) || location.search);
  if (!authEnabled || !q.has("error")) return null;
  history.replaceState(null, "", location.pathname);
  return q.get("error_code") === "otp_expired" ? "expired" : "failed";
}
export const LINK_ERROR = readLinkError();

// Back to the page the visitor signed in from, without any old query string.
const here = () => location.origin + location.pathname;

export async function accessToken(): Promise<string | null> {
  if (!authEnabled) return null;
  const { data } = await supa().auth.getSession();
  return data.session?.access_token ?? null;
}

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!authEnabled) return;
    supa().auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supa().auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export async function signInWithEmail(email: string) {
  const { error } = await supa().auth.signInWithOtp({ email, options: { emailRedirectTo: here() } });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supa().auth.signInWithOAuth({ provider: "google", options: { redirectTo: here() } });
  if (error) throw error;
}

export const signOut = () => supa().auth.signOut();
