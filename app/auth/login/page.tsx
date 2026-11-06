"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { safeNextPath } from "@/lib/auth/client";

type Mode = "login" | "signup" | "forgot";

function AuthForm() {
  const { client, configured, user, loading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNextPath(search.get("next"));
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  function switchMode(value: Mode) {
    setMode(value);
    setError("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "forgot") {
        const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage("비밀번호 재설정 안내 메일을 보냈습니다. 메일함을 확인해 주세요.");
      } else if (mode === "signup") {
        if (password.length < 8) {
          setError("비밀번호는 8자 이상으로 설정해 주세요.");
          return;
        }
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) setMessage("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인할 수 있어요.");
        else router.replace(next);
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        router.replace(next);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "요청을 완료하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    if (!client) return;
    setBusy(true);
    setError("");
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }

  return <main className="if-auth-page">
    <div className="if-auth-top"><Link href="/"><ArrowLeft size={15} /> BACK TO IF.</Link><span>IF. / ACCOUNT</span></div>
    <div className="if-auth-split">
      <section className="if-auth-intro">
        <span className="if-auth-kicker">IDENTITY / 001</span>
        <Image src="/brand/if-logo.svg" alt="IF." width={106} height={106} priority />
        <h1>Every worldline<br />starts with you.</h1>
        <p>A place to keep the histories you create. Your account belongs to IF., independently of Drawing ID.</p>
        <div className="if-auth-graphic" aria-hidden="true"><i /><i /><i /><b /></div>
        <small>ONE EVENT. INFINITE POSSIBILITIES.</small>
      </section>
      <section className="if-auth-card">
        <span className="if-auth-kicker">SECURE ACCESS / IF.</span>
        <h2>{mode === "login" ? "Welcome back." : mode === "signup" ? "Create your account." : "Reset your password."}</h2>
        <p>{mode === "login" ? "Sign in to continue your world." : mode === "signup" ? "One account for every history you imagine." : "We’ll email you a secure reset link."}</p>

        {!configured && <div className="if-auth-alert" role="status">아직 IF. 전용 Supabase 프로젝트가 연결되지 않았습니다. README의 인증 설정을 완료하면 사용할 수 있어요.</div>}

        <form onSubmit={submit}>
          {mode === "signup" && <label>DISPLAY NAME<input type="text" autoComplete="nickname" maxLength={40} value={name} onChange={event => setName(event.target.value)} placeholder="Your name" disabled={busy || !configured} /></label>}
          <label>EMAIL ADDRESS<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" disabled={busy || !configured} /></label>
          {mode !== "forgot" && <label>PASSWORD<input type="password" minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "signup" ? "8 characters or more" : "Your password"} disabled={busy || !configured} /></label>}
          {mode === "login" && <button type="button" className="if-auth-text-button" onClick={() => switchMode("forgot")}>Forgot password?</button>}
          {error && <div className="if-auth-alert error" role="alert">{error}</div>}
          {message && <div className="if-auth-alert success" role="status">{message}</div>}
          <button type="submit" className="if-auth-submit" disabled={!configured || busy || loading}>
            {busy ? "WORKING…" : mode === "login" ? "SIGN IN" : mode === "signup" ? "CREATE ACCOUNT" : "SEND RESET EMAIL"} <ArrowRight size={16} />
          </button>
        </form>
        {mode !== "forgot" && <>
          <div className="if-auth-divider"><span>OR CONTINUE WITH</span></div>
          <button type="button" className="if-auth-google" onClick={signInGoogle} disabled={!configured || busy || loading}>G <span>Continue with Google</span> <ArrowRight size={15} /></button>
        </>}
        <div className="if-auth-switch">
          {mode === "login" ? <>New to IF.? <button type="button" onClick={() => switchMode("signup")}>Create an account ↗</button></>
            : <>Already have an account? <button type="button" onClick={() => switchMode("login")}>Sign in ↗</button></>}
        </div>
      </section>
    </div>
  </main>;
}

export default function AuthLoginPage() {
  return <Suspense fallback={<main className="auth-gate">LOADING IF. ACCOUNT…</main>}><AuthForm /></Suspense>;
}
