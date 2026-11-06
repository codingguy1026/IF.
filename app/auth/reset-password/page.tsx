"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ResetPasswordPage() {
  const { client, user, loading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !user) return;
    if (password.length < 8) { setError("비밀번호는 8자 이상이어야 합니다."); return; }
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    setBusy(true);
    setError("");
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else {
      setMessage("비밀번호가 변경되었습니다.");
      window.setTimeout(() => router.replace("/profile"), 900);
    }
    setBusy(false);
  }

  return <main className="auth-gate if-reset-page">
    <span>IF. / ACCOUNT RECOVERY</span><h1>Choose a new password.</h1>
    {!loading && !user && <><p>비밀번호 재설정 이메일에 포함된 링크를 열어 주세요.</p><Link href="/auth/login">Return to sign in ↗</Link></>}
    {!loading && user && <form className="if-reset-form" onSubmit={updatePassword}>
      <label>NEW PASSWORD<input autoComplete="new-password" type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required /></label>
      <label>CONFIRM PASSWORD<input autoComplete="new-password" type="password" value={confirm} onChange={event => setConfirm(event.target.value)} minLength={8} required /></label>
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button disabled={busy} type="submit">UPDATE PASSWORD ↗</button>
    </form>}
  </main>;
}
