"use client";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { worlds } from "@/lib/data";

export default function ExplorePage(){
 const [query,setQuery]=useState(""); const [sort,setSort]=useState("Active");
 const shown=useMemo(()=>worlds.filter(w=>(w.name+w.description).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="Most branched"?b.branches-a.branches:sort==="Newest"?a.events-b.events:b.members-a.members),[query,sort]);
 return <main className="page explore-page"><header className="topbar"><div className="breadcrumbs">PUBLIC ARCHIVE <span>/</span> EXPLORE</div></header>
  <section className="explore-intro"><span>DISCOVER / 004 WORLDS</span><h1>Other histories<br/>are being written.</h1><p>Enter public worlds, trace their histories, or find the moment where yours begins.</p></section>
  <div className="explore-tools"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search worlds, histories, creators..."/></label><div>{["Active","Newest","Most branched"].map(x=><button className={sort===x?"active":""} onClick={()=>setSort(x)} key={x}>{x}</button>)}</div></div>
  <section className="world-grid">{shown.map((w,i)=><Link href={`/world/${w.id}`} className="world-card" key={w.id}><div className="card-index">0{i+1} <ArrowUpRight/></div><div className="card-glyph">{w.glyph}</div><div><span className="policy">{w.policy}</span><h2>{w.name}</h2><p>{w.description}</p></div><footer><span>{w.events} EVENTS</span><span>{w.members} MEMBERS</span><span>{w.branches} BRANCHES</span></footer></Link>)}</section>
 </main>
}
