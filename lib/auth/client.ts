import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// IF. has its own Supabase project, separate from Drawing ID.
// Public publishable keys are safe in the browser. Never put service role keys here.
let singleton: SupabaseClient | null | undefined;

export function getAuthClient(): SupabaseClient | null {
  if (singleton !== undefined) return singleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    singleton = null;
    return singleton;
  }
  singleton = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return singleton;
}

export function safeNextPath(value: string | null | undefined, fallback = "/profile"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.startsWith("/auth")) return fallback;
  return value;
}

export function displayName(user: { email?: string; user_metadata?: Record<string, unknown> }): string {
  const name = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] || "Archivist";
}
