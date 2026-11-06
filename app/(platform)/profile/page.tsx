"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayName } from "@/lib/auth/client";

function AccountProfile() {
  const { client, user, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setName(displayName(user));
  }, [user]);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !user) return;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      setError("이름은 2~40자로 설정해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const { error: updateError } = await client.auth.updateUser({ data: { display_name: trimmed } });
    if (updateError) setError(updateError.message);
    else setMessage("프로필 이름이 저장되었습니다.");
    setBusy(false);
  }

  async function logout() {
    setBusy(true);
    setError("");
    const signOutError = await signOut();
    if (signOutError) { setError(signOutError); setBusy(false); return; }
    router.replace("/auth/login");
  }

  return <main className="page">
    <header className="topbar"><div className="breadcrumbs">IF. <span>/</span> ACCOUNT <span>/</span> PROFILE</div></header>
    <section className="explore-intro">
      <span>ARCHIVIST / IF. ACCOUNT</span>
      <h1>{user ? displayName(user) : "Your profile"}</h1>
      <p>This account is for IF. only. It is separate from Drawing ID.</p>
    </section>
    <section className="if-profile-card">
      <div><span>ACCOUNT EMAIL</span><strong>{user?.email || "No email address"}</strong><small>Only visible to you.</small></div>
      <form onSubmit={updateProfile}>
        <label htmlFor="if-display-name">DISPLAY NAME</label>
        <input id="if-display-name" value={name} onChange={event => setName(event.target.value)} maxLength={40} required disabled={busy} />
        {error && <p role="alert" className="if-profile-error">{error}</p>}
        {message && <p role="status" className="if-profile-success">{message}</p>}
        <button type="submit" disabled={busy}>SAVE PROFILE ↗</button>
      </form>
      <div className="if-profile-actions">
        <Link href="/auth/login">Account settings</Link>
        <button type="button" onClick={logout} disabled={busy}>Sign out ↗</button>
      </div>
    </section>
    <p className="if-profile-note">Worlds and branches are currently prototype data. Account-linked cloud storage will be added separately.</p>
  </main>;
}

export default function Profile() {
  return <RequireAuth next="/profile"><AccountProfile /></RequireAuth>;
}
