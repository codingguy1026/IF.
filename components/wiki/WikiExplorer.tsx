"use client";

import { ArrowUpRight, Clock3, FileText, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { articleTypes, type WikiArticle } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

export function WikiExplorer({ worldId, articles }: { worldId: string; articles: WikiArticle[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const visible = useMemo(() => articles.filter(article =>
    (category === "All" || article.type === category) &&
    `${article.title} ${article.summary} ${article.type}`.toLowerCase().includes(query.toLowerCase())
  ), [articles, category, query]);
  const counts = Object.fromEntries(articleTypes.map(type => [type, articles.filter(article => article.type === type).length]));

  return <>
    <section className="wiki-search" aria-label="Search this world's wiki">
      <Search />
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people, places, events, ideas…" aria-label="Search wiki" />
      <span>{visible.length} records</span>
    </section>
    <div className="wiki-layout">
      <aside className="category-rail">
        <div className="rail-heading"><SlidersHorizontal /> Browse archive</div>
        {["All", ...articleTypes].map(type => <button className={category === type ? "active" : ""} onClick={() => setCategory(type)} key={type}>
          <span>{type}</span><b>{type === "All" ? articles.length : counts[type] || 0}</b>
        </button>)}
      </aside>
      <section className="article-results" aria-live="polite">
        <header><div><span>INDEX / {category.toUpperCase()}</span><h2>{category === "All" ? "All records" : category}</h2></div><small>Sorted by recent activity</small></header>
        {visible.length ? visible.map((article, index) => <Link className="article-row" href={`/world/${worldId}/wiki/${article.id}`} key={article.id}>
          <span className="article-number">{String(index + 1).padStart(2, "0")}</span>
          <div className="article-row-main"><div><span className="article-type">{article.type}</span><StatusBadge status={article.status} /></div><h3>{article.title}</h3><p>{article.summary}</p></div>
          <div className="article-meta"><span><FileText />{article.branchName}</span><span><Clock3 />{article.updated}</span></div>
          <ArrowUpRight className="row-arrow" />
        </Link>) : <div className="empty-results"><Search/><h3>No records found</h3><p>Try another phrase or category.</p></div>}
      </section>
    </div>
  </>;
}
