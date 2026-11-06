"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayName } from "@/lib/auth/client";

export function AccountEntry({ compact = false }: { compact?: boolean }) {
  const { loading, user } = useAuth();
  return <Link href={user ? "/profile" : "/auth/login"} className={compact ? "if-account-link compact" : "if-account-link"}>
    <span className="if-account-dot" aria-hidden="true" />
    {loading ? "ACCOUNT" : user ? displayName(user) : "SIGN IN"}
  </Link>;
}
