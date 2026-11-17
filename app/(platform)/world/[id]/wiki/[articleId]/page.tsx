import { ArrowUpRight, Clock3, GitBranch, Pencil, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/wiki/StatusBadge";
import { articleById, articleVersions, timeline, worldById, type WikiArticle } from "@/lib/data";
import "../wiki.css";

export default async function ArticlePage({ params }: { params: Promise<{ id: string; articleId: string }> }) {
  const { id, articleId } = await params;
  const world = worldById(id);
  const article = articleById(articleId);
  if (!world || !article || article.worldId !== id) notFound();

  const related = article.relatedArticleIds.map(articleById).filter((item): item is WikiArticle => item?.worldId === id);
  const backlinks = article.backlinks.map(articleById).filter((item): item is WikiArticle => item?.worldId === id);
  const events = timeline.filter(event => article.relatedEventIds.includes(event.id));
  const versions = articleVersions(article.title).filter(version => version.worldId === id);
  const archiveUrl = `/world/${id}/wiki`;

  return (
    <main className="page wiki-frame">
      <header className="wiki-masthead">
        <nav className="wiki-crumbs" aria-label="Breadcrumb">
          <Link href={`/world/${id}`}>{world.name}</Link>
          <Link href={archiveUrl}>Wiki</Link>
          <span aria-current="page">{article.type}</span>
        </nav>
        <Link className="wiki-action" href={`${archiveUrl}/new?from=${article.id}`}>
          <Pencil aria-hidden="true" /> Propose edit
        </Link>
      </header>
      <header className="wiki-article-header">
        <div className="wiki-kicker">{article.type}</div>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
        <div className="wiki-byline">
          <span><UserRound aria-hidden="true" />Created by {article.creator}</span>
          <span><Clock3 aria-hidden="true" />Updated {article.updated}</span>
        </div>
      </header>
      <div className="wiki-worldlines">
        <span className="wiki-kicker"><GitBranch aria-hidden="true" /> Worldline</span>
        {versions.length > 1 ? (
          <nav aria-label="Article worldlines">
            {versions.map(version => (
              <Link key={version.id} aria-current={version.id === article.id ? "page" : undefined} href={`${archiveUrl}/${version.id}`}>
                {version.branchName}
              </Link>
            ))}
          </nav>
        ) : <strong>{article.branchName}</strong>}
        <StatusBadge status={article.status} />
      </div>
      <div className="wiki-article-layout">
        <article className="wiki-article-content">
          <div className="wiki-prose">
            {article.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          {events.length > 0 && (
            <section className="wiki-article-section">
              <header>
                <h2>Related events</h2>
                <Link className="wiki-timeline-link" href={`/world/${id}`}>Open timeline <ArrowUpRight aria-hidden="true" /></Link>
              </header>
              <ul className="wiki-event-list">
                {events.map(event => (
                  <li key={event.id}>
                    <time>{event.year}</time>
                    <div><h3>{event.title}</h3><p>{event.text}</p></div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {related.length > 0 && (
            <section className="wiki-article-section">
              <header><h2>Related records</h2></header>
              <div className="wiki-related">
                {related.map(item => (
                  <Link href={`${archiveUrl}/${item.id}`} key={item.id}>
                    <span className="wiki-kicker">{item.type}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
        <aside className="wiki-article-aside">
          <section className="wiki-facts">
            <h2>Key facts</h2>
            <dl>
              {article.infobox.map(field => (
                <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
              ))}
            </dl>
          </section>
          <section className="wiki-aside-section">
            <h2>Referenced by</h2>
            {backlinks.length ? (
              <ul>
                {backlinks.map(item => (
                  <li key={item.id}>
                    <Link href={`${archiveUrl}/${item.id}`}>{item.title}<ArrowUpRight aria-hidden="true" /></Link>
                  </li>
                ))}
              </ul>
            ) : <p>No records link here yet.</p>}
          </section>
          <section className="wiki-aside-section">
            <h2>Edit history</h2>
            <ol>
              {article.revisions.map(revision => (
                <li key={revision.id}>
                  <strong>{revision.note}</strong>
                  <span>{revision.author} · {revision.date}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
