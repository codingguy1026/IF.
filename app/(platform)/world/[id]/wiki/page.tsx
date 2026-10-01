import { BookOpen, GitBranch, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WikiExplorer } from "@/components/wiki/WikiExplorer";
import { wikiArticles, worldById } from "@/lib/data";

export default async function WikiPage({ params }: { params:Promise<{id:string}> }) {
  const { id } = await params;
  const world = worldById(id);
  if (!world) notFound();
  const articles = wikiArticles.filter(article => article.worldId === id);
  return <main className="page wiki-page">
    <header className="topbar"><div className="breadcrumbs">WORLDS <span>/</span> {world.name.toUpperCase()} <span>/</span> WIKI</div><div className="top-actions"><Link className="button-link" href={`/world/${id}`}>World overview</Link><Link className="button-link primary" href={`/world/${id}/wiki/new`}><Plus/>New article</Link></div></header>
    <section className="wiki-hero"><div className="archive-seal"><BookOpen/></div><div><span>THE LIVING ARCHIVE</span><h1>{world.name} <i>Wiki</i></h1><p>People, places, institutions, and ideas—versioned across every worldline.</p></div><div className="wiki-stats"><div><b>{articles.length}</b><span>RECORDS</span></div><div><b>3</b><span>WORLDLINES</span></div><div><b>24</b><span>REVISIONS</span></div></div></section>
    <nav className="tabs world-tabs"><Link href={`/world/${id}`}>Overview</Link><Link href={`/world/${id}#timeline`}>Timeline</Link><Link className="active" href={`/world/${id}/wiki`}>Wiki</Link><Link href={`/world/${id}#branches`}><GitBranch/> Branches</Link></nav>
    <WikiExplorer worldId={id} articles={articles}/>
  </main>;
}
