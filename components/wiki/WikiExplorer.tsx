"use client";

import { ArrowUpRight, Clock3, GitBranch, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { articleTypes, type WikiArticle, type WikiArticleType } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

export function WikiExplorer({ worldId, articles }: { worldId: string; articles: WikiArticle[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WikiArticleType | "All">("All");
  const term = query.trim().toLowerCase();
  const visible = articles.filter(article =>
    (category === "All" || article.type === category) &&
    `${article.title} ${article.summary} ${article.type} ${article.branchName}`.toLowerCase().includes(term)
  );
  const categories = ["All", ...articleTypes] as const;

  return (
    <div className="wiki-index">
      <aside className="wiki-categories" aria-labelledby="wiki-category-title">
        <h2 id="wiki-category-title">Categories</h2>
        <div>
          {categories.map(type => (
            <button type="button" aria-pressed={category === type} onClick={() => setCategory(type)} key={type}>
              <span>{type === "All" ? "All records" : type}</span>
              <span>{type === "All" ? articles.length : articles.filter(article => article.type === type).length}</span>
            </button>
          ))}
        </div>
      </aside>
      <section className="wiki-results" aria-labelledby="wiki-results-title">
        <div className="wiki-search" role="search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search records or worldlines"
            aria-label="Search wiki"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X aria-hidden="true" /></button>}
        </div>
        <div className="wiki-results-heading">
          <h2 id="wiki-results-title">{category === "All" ? "All records" : category}</h2>
          <span role="status">{visible.length} {visible.length === 1 ? "record" : "records"}</span>
        </div>
        {visible.length > 0 ? (
          <ul className="wiki-records">
            {visible.map(article => (
              <li key={article.id}>
                <Link className="wiki-row" href={`/world/${worldId}/wiki/${article.id}`}>
                  <div className="wiki-row-copy">
                    <span className="wiki-kicker">{article.type}</span>
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                  </div>
                  <div className="wiki-row-meta">
                    <span><GitBranch aria-hidden="true" />{article.branchName}</span>
                    <span><Clock3 aria-hidden="true" />{article.updated}</span>
                  </div>
                  <div className="wiki-row-status">
                    <StatusBadge status={article.status} />
                    <ArrowUpRight aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="wiki-empty">
            <h3>{articles.length ? "No matching records" : "No records yet"}</h3>
            <p>{articles.length ? "Try another search or category." : "Add the first article to this world’s archive."}</p>
            {!articles.length && <Link className="wiki-timeline-link" href={`/world/${worldId}/wiki/new`}>New article <ArrowUpRight aria-hidden="true" /></Link>}
          </div>
        )}
      </section>
    </div>
  );
}
