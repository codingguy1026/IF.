"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { safeNextPath } from "@/lib/auth/client";

function FinishAuth() {
  const { client, user, loading } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNextPath(params.get("next"));
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(next);
      return;
    }
    if (!client) {
      setError("IF. 인증 설정이 필요합니다.");
      return;
    }
    let active = true;
    void client.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (data.user) router.replace(next);
      else setError(authError?.message || "인증 링크를 확인할 수 없어요. 로그인 화면에서 다시 시도해 주세요.");
    }).catch(() => {
      if (active) setError("인증 중 오류가 발생했습니다. 다시 시도해 주세요.");
    });
    return () => { active = false; };
  }, [client, user, loading, next, router]);

  return <main className="auth-gate">
    <span>IF. / AUTH CALLBACK</span><h1>{error ? "Unable to connect." : "Connecting your worldline…"}</h1>
    {error && <><p role="alert">{error}</p><Link href="/auth/login">Return to sign in ↗</Link></>}
  </main>;
}

export default function CallbackPage() {
  return <Suspense fallback={<main className="auth-gate">VERIFYING SESSION…</main>}><FinishAuth /></Suspense>;
}
