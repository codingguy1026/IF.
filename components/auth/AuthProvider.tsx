"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAuthClient } from "@/lib/auth/client";

type AuthContextState = {
  client: SupabaseClient | null;
  configured: boolean;
  loading: boolean;
  user: User | null;
  signOut: () => Promise<string | null>;
};

const client = getAuthClient();
const AuthContext = createContext<AuthContextState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });
    void client.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!error) setUser(data.user);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextState>(() => ({
    client,
    configured: Boolean(client),
    loading,
    user,
    signOut: async () => {
      if (!client) return "IF. 인증 서비스가 설정되지 않았습니다.";
      const { error } = await client.auth.signOut();
      return error?.message ?? null;
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
