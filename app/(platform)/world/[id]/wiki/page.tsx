import { ArrowUpRight, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WikiExplorer } from "@/components/wiki/WikiExplorer";
import { wikiArticles, worldById } from "@/lib/data";
import "./wiki.css";

export default async function WikiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const world = worldById(id);
  if (!world) notFound();

  const articles = wikiArticles.filter(article => article.worldId === id);

  return (
    <main className="page wiki-frame">
      <header className="wiki-masthead">
        <nav className="wiki-crumbs" aria-label="Breadcrumb">
          <Link href="/explore">Worlds</Link>
          <Link href={`/world/${id}`}>{world.name}</Link>
          <span aria-current="page">Wiki</span>
        </nav>
        <Link className="wiki-action" href={`/world/${id}/wiki/new`}>
          <Plus aria-hidden="true" /> New article
        </Link>
      </header>
      <section className="wiki-hero">
        <div>
          <div className="wiki-kicker"><BookOpen aria-hidden="true" /> World archive</div>
          <h1>{world.name}<em>Wiki</em></h1>
        </div>
        <Link className="wiki-timeline-link" href={`/world/${id}`}>
          Open timeline <ArrowUpRight aria-hidden="true" />
        </Link>
      </section>
      <WikiExplorer worldId={id} articles={articles} />
    </main>
  );
}
