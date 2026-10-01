"use client";
import Link from "next/link";
import { Compass, Plus, Search, UserRound, Menu, X } from "lucide-react";
import { useState } from "react";
import { worlds } from "@/lib/data";
import { BrandMark } from "@/components/brand/BrandMark";

export function AppShell({ children }: { children: React.ReactNode }) {
 const [menu, setMenu] = useState(false);
 return <div className="app-shell">
  <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">{menu ? <X/> : <Menu/>}</button>
  <aside className={`sidebar ${menu ? "is-visible" : ""}`}>
   <Link href="/" className="sidebar-logo"><BrandMark compact /></Link>
   <p className="eyebrow">My worlds</p>
   <nav className="world-list" aria-label="My worlds">{worlds.slice(0,3).map((w,i)=><Link className={i===0?"active":""} href={`/world/${w.id}`} key={w.id}><span>{w.glyph}</span>{w.name}</Link>)}</nav>
   <Link href="/create" className="create-link"><Plus size={15}/> Create world</Link>
   <nav className="utility-nav"><Link href="/explore"><Compass size={17}/>Explore</Link><Link href="/explore"><Search size={17}/>Search</Link><Link href="/profile"><UserRound size={17}/>Profile</Link></nav>
   <div className="user-chip"><span>MV</span><div><b>Mara Voss</b><small>Archivist</small></div></div>
  </aside>
  <div className="app-content" onClick={()=>menu&&setMenu(false)}>{children}</div>
 </div>;
}
