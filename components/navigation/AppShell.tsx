"use client";
import Link from "next/link";
import { Compass, Plus, Search, UserRound, Menu, X, LogIn } from "lucide-react";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { worlds } from "@/lib/data";
import { InteractiveBrandMark } from "@/components/brand/InteractiveBrandMark";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayName } from "@/lib/auth/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isWorldMap = /^\/world\/[^/]+\/?$/.test(pathname);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (switchTimer.current) clearTimeout(switchTimer.current); }, []);

  function switchWorld(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (switchTimer.current) clearTimeout(switchTimer.current);
    setSwitching(true);
    switchTimer.current = setTimeout(() => { router.push(href); setSwitching(false); setMenu(false); }, 180);
  }

  if (isWorldMap) return <div className="map-app-content">{children}</div>;
  const label = user ? displayName(user) : "Guest";
  return <div className="app-shell">
    <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">{menu ? <X /> : <Menu />}</button>
    <aside className={`sidebar ${menu ? "is-visible" : ""}`}>
      <InteractiveBrandMark />
      <p className="eyebrow">Explore worlds</p>
      <nav className="world-list" aria-label="Explore worlds">{worlds.slice(0, 3).map(w => {
        const href = `/world/${w.id}`;
        return <Link onClick={event => switchWorld(event, href)} className={pathname.startsWith(href) ? "active" : ""} href={href} key={w.id}><span>{w.glyph}</span>{w.name}</Link>;
      })}</nav>
      <Link href="/create" className="create-link"><Plus size={15} /> Create world</Link>
      <nav className="utility-nav">
        <Link href="/explore"><Compass size={17} />Explore</Link>
        <Link href="/explore"><Search size={17} />Search</Link>
        {user ? <Link href="/profile"><UserRound size={17} />My account</Link>
          : <Link href="/auth/login"><LogIn size={17} />Sign in</Link>}
      </nav>
      <div className="user-chip">
        <span>{user ? label.slice(0, 2).toUpperCase() : "IF"}</span>
        <div><b>{loading ? "Checking account…" : label}</b><small>{user ? "IF. Account" : "Not signed in"}</small></div>
      </div>
    </aside>
    <div key={pathname} className={`app-content route-resolve ${switching ? "is-switching" : ""}`} onClick={() => menu && setMenu(false)}>{children}</div>
  </div>;
}
