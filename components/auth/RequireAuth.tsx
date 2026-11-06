"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function RequireAuth({ children, next }: { children: React.ReactNode; next: string }) {
  const { loading, user, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && configured) {
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, configured, next, router]);

  if (loading) return <main className="auth-gate"><span>IF. / VERIFYING SESSION</span><h1>Connecting your worldline…</h1></main>;
  if (!configured) return <main className="auth-gate"><span>IF. / SETUP REQUIRED</span><h1>Authentication is not configured.</h1><p>Configure a separate IF. Supabase project before creating an account.</p><Link href="/auth/login">View setup details ↗</Link></main>;
  if (!user) return <main className="auth-gate"><span>IF. / SIGN IN REQUIRED</span><h1>Sign in to continue.</h1><Link href={`/auth/login?next=${encodeURIComponent(next)}`}>Sign in ↗</Link></main>;
  return <>{children}</>;
}
