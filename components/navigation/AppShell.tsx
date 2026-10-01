"use client";
import Link from "next/link";
import { Compass, Plus, Search, UserRound, Menu, X } from "lucide-react";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { worlds } from "@/lib/data";
import { InteractiveBrandMark } from "@/components/brand/InteractiveBrandMark";

export function AppShell({ children }: { children: React.ReactNode }) {
 const [menu, setMenu] = useState(false);
 const [switching, setSwitching] = useState(false);
 const router = useRouter();
 const pathname = usePathname();
 const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
 useEffect(() => () => { if (switchTimer.current) clearTimeout(switchTimer.current); }, []);
 function switchWorld(event:MouseEvent<HTMLAnchorElement>, href:string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (switchTimer.current) clearTimeout(switchTimer.current);
  setSwitching(true);
  switchTimer.current=setTimeout(()=>{router.push(href);setSwitching(false);setMenu(false)},180);
 }
 return <div className="app-shell">
  <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">{menu ? <X/> : <Menu/>}</button>
  <aside className={`sidebar ${menu ? "is-visible" : ""}`}>
   <InteractiveBrandMark />
   <p className="eyebrow">My worlds</p>
   <nav className="world-list" aria-label="My worlds">{worlds.slice(0,3).map(w=>{const href=`/world/${w.id}`;return <Link onClick={event=>switchWorld(event,href)} className={pathname.startsWith(href)?"active":""} href={href} key={w.id}><span>{w.glyph}</span>{w.name}</Link>})}</nav>
   <Link href="/create" className="create-link"><Plus size={15}/> Create world</Link>
   <nav className="utility-nav"><Link href="/explore"><Compass size={17}/>Explore</Link><Link href="/explore"><Search size={17}/>Search</Link><Link href="/profile"><UserRound size={17}/>Profile</Link></nav>
   <div className="user-chip"><span>MV</span><div><b>Mara Voss</b><small>Archivist</small></div></div>
  </aside>
  <div key={pathname} className={`app-content route-resolve ${switching?"is-switching":""}`} onClick={()=>menu&&setMenu(false)}>{children}</div>
 </div>;
}
