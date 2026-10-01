import { notFound } from "next/navigation";
import { ArrowUpRight, GitBranch, Settings, ShieldCheck, Users } from "lucide-react";
import { worlds } from "@/lib/data";
import { BranchTimeline } from "@/components/timeline/BranchTimeline";

export default async function WorldPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const world=worlds.find(w=>w.id===id) ?? worlds[0]; if(!world) notFound();
 return <main className="page world-page">
  <header className="topbar"><div className="breadcrumbs">WORLDS <span>/</span> {world.name.toUpperCase()}</div><div className="top-actions"><button><Users/> Invite</button><button className="primary">+ New event</button></div></header>
  <section className="world-hero"><div className="world-symbol">{world.glyph}</div><div><div className="world-kicker"><span>PUBLIC ARCHIVE</span><i>{world.policy}</i></div><h1>{world.name}</h1><p>{world.description}</p><small>CURATED BY {world.owner.toUpperCase()} · EST. 2024</small></div></section>
  <nav className="tabs"><a className="active" href="#overview">Overview</a><a href="#timeline">Timeline</a><a href={`/world/${id}/wiki`}>Wiki</a><a href="#branches">Branches <span>8</span></a><a href="#members">Members</a><a href="#settings"><Settings/> </a></nav>
  <section className="metrics"><div><b>{world.members}</b><span>CONTRIBUTORS</span></div><div><b>{world.events}</b><span>TIMELINE EVENTS</span></div><div><b>{world.branches}</b><span>ACTIVE BRANCHES</span></div><div><b>12.4m</b><span>LORE WORDS</span></div></section>
  <section id="timeline" className="section-block"><div className="section-title"><div><span>01 / WORLDLINE</span><h2>The living history</h2></div><button>View full timeline <ArrowUpRight/></button></div><BranchTimeline worldId={id}/></section>
  <section className="two-column" id="lore"><div className="section-block"><div className="section-title"><div><span>02 / GOVERNANCE</span><h2>World rules</h2></div><ShieldCheck/></div><ol className="rules"><li><span>01</span>Technology must follow plausible scientific progression.</li><li><span>02</span>Major political events require two supporting entries.</li><li><span>03</span>Established characters cannot be removed from canon.</li></ol></div><div className="section-block"><div className="section-title"><div><span>03 / WIKI</span><h2>Recent records</h2></div><a className="section-link" href={`/world/${id}/wiki`}>Open archive <ArrowUpRight/></a></div><div className="lore-list"><a href={`/world/${id}/wiki/lunar-assembly`}><span>ORGANIZATION</span><h3>Lunar Assembly</h3><p>The first elected body beyond Earth.</p></a><a href={`/world/${id}/wiki/artemis`}><span>CITY</span><h3>Artemis</h3><p>Capital city · Population 4.8m</p></a></div></div></section>
  <section className="activity"><div><GitBranch/><span><b>Elena R.</b> proposed a new branch from <b>Moon Declares Independence</b></span></div><time>12 MIN AGO</time></section>
 </main>;
}
