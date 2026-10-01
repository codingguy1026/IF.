import { ArrowLeft, ArrowUpRight, Clock3, FileText, GitBranch, Link2, Pencil, RotateCcw, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/wiki/StatusBadge";
import { articleById, articleVersions, timeline, worldById } from "@/lib/data";

export default async function ArticlePage({ params }: { params:Promise<{id:string;articleId:string}> }) {
  const { id, articleId } = await params;
  const world = worldById(id);
  const article = articleById(articleId);
  if (!world || !article || article.worldId !== id) notFound();
  const related = article.relatedArticleIds.map(articleById).filter(Boolean);
  const backlinks = article.backlinks.map(articleById).filter(Boolean);
  const events = timeline.filter(event => article.relatedEventIds.includes(event.id));
  const versions = articleVersions(article.title);
  return <main className="page article-page">
    <header className="topbar"><div className="breadcrumbs">{world.name.toUpperCase()} <span>/</span> WIKI <span>/</span> {article.type.toUpperCase()}</div><div className="top-actions"><Link className="button-link" href={`/world/${id}/wiki`}><ArrowLeft/>Archive index</Link><Link className="button-link primary" href={`/world/${id}/wiki/new?from=${article.id}`}><Pencil/> Propose edit</Link></div></header>
    <section className="article-branchbar"><div><GitBranch/><span>VIEWING WORLDLINE</span><b>{article.branchName}</b></div>{versions.length > 1 && <div className="version-switcher">{versions.map(version=><Link key={version.id} className={version.id===article.id?"active":""} href={`/world/${id}/wiki/${version.id}`}>{version.branchName}</Link>)}</div>}<StatusBadge status={article.status}/></section>
    <article className="article-layout">
      <div className="article-body">
        <header><span className="record-label">{article.type} / RECORD {article.id.toUpperCase()}</span><h1>{article.title}</h1><p className="article-summary">{article.summary}</p><div className="article-byline"><span><UserRound/>Created by {article.creator}</span><span><Clock3/>Updated {article.updated}</span></div></header>
        <div className="article-copy">{article.content.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
        {related.length > 0 && <section className="record-section"><div className="record-heading"><span>LINKED RECORDS</span><h2>Related entities</h2></div><div className="related-grid">{related.map(item=>item && <Link href={`/world/${id}/wiki/${item.id}`} key={item.id}><span>{item.type}</span><h3>{item.title}</h3><p>{item.summary}</p><ArrowUpRight/></Link>)}</div></section>}
        <section className="record-section"><div className="record-heading"><span>TIMELINE CONNECTIONS</span><h2>Related events</h2></div><div className="linked-events">{events.map(event=><Link href={`/world/${id}#timeline`} key={event.id}><time>{event.year}</time><i/><div><h3>{event.title}</h3><p>{event.text}</p></div><ArrowUpRight/></Link>)}</div></section>
      </div>
      <aside className="article-aside">
        <section className="infobox"><header><span>{article.type}</span><b>{article.title}</b></header>{article.infobox.map(field=><div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}<footer><FileText/> Data valid in <b>{article.branchName}</b></footer></section>
        <section className="backlinks"><header><Link2/><div><span>REFERENCED BY</span><h2>Backlinks</h2></div></header>{backlinks.length ? backlinks.map(item=>item&&<Link href={`/world/${id}/wiki/${item.id}`} key={item.id}><span>{item.type}</span>{item.title}<ArrowUpRight/></Link>) : <p>No records link here yet.</p>}</section>
        <section className="history"><header><RotateCcw/><div><span>CHANGE LOG</span><h2>Edit history</h2></div></header>{article.revisions.map((revision,index)=><div className="revision" key={revision.id}><i/><div><b>{revision.note}</b><span>{revision.author} · {revision.date}</span></div>{index===0&&<em>LATEST</em>}</div>)}</section>
      </aside>
    </article>
  </main>;
}
