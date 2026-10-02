"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Plus, Search, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { timeline, WikiArticle, wikiArticles, World } from "@/lib/data";

type SearchResult = { label: string; meta: string; href?: string };

export function WorldMap({ world }: { world: World }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const articles = useMemo(() => wikiArticles.filter((article) => article.worldId === world.id), [world.id]);
  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    const events = timeline
      .filter((event) => `${event.year} ${event.title} ${event.text}`.toLocaleLowerCase().includes(term))
      .map((event) => ({ label: event.title, meta: `${event.year} · 사건` }));
    const records = articles
      .filter((article: WikiArticle) => `${article.title} ${article.type} ${article.summary}`.toLocaleLowerCase().includes(term))
      .map((article) => ({ label: article.title, meta: `${article.type} · 기록`, href: `/world/${world.id}/wiki/${article.id}` }));
    return [...events, ...records].slice(0, 6);
  }, [articles, query, world.id]);

  function addYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const year = String(form.get("year") || "").trim();
    if (!year) return;
    setYears((current) => [...current, year]);
    setYearOpen(false);
  }

  return <main className="world-map-shell">
    <header className="world-map-header">
      <div className="world-map-identity">
        <Image src="/brand/if-logo.svg" alt="IF." width={70} height={70} priority />
        <h1>{world.name} <span>·</span> 2036</h1>
      </div>
      <div className="world-search-wrap">
        <label className="world-search">
          <span className="sr-only">세계관 검색</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="연도, 사건, 인물, 장소, 타임라인 검색" />
          <Search aria-hidden="true" />
        </label>
        {query && <div className="world-search-results">
          {results.length ? results.map((result, index) => result.href
            ? <Link key={`${result.label}-${index}`} href={result.href}><b>{result.label}</b><span>{result.meta}</span></Link>
            : <button key={`${result.label}-${index}`} onClick={() => setQuery(result.label)}><b>{result.label}</b><span>{result.meta}</span></button>)
            : <p>일치하는 기록이 없습니다.</p>}
        </div>}
      </div>
    </header>

    <section className="world-map-canvas" aria-label={`${world.name} 연도별 타임라인 지도`}>
      <div className="map-origin-line" />
      <div className="map-year map-year-origin"><span>2036</span><i /></div>
      {years.map((year, index) => <div className="map-year map-year-created" style={{ left: `${Math.min(78, 23 + index * 16)}%` }} key={`${year}-${index}`}><span>{year}</span><i /></div>)}
    </section>

    <aside className={`world-map-toolbar ${toolsOpen ? "is-open" : ""}`} aria-label="지도 도구">
      <button className="toolbar-menu" onClick={() => setToolsOpen((open) => !open)} aria-expanded={toolsOpen} aria-label={toolsOpen ? "툴바 닫기" : "툴바 열기"}>{toolsOpen ? <X /> : <Menu />}</button>
      <button className="toolbar-add" onClick={() => setYearOpen(true)} aria-label="새 연도 타임라인 만들기"><Plus /></button>
    </aside>
    {toolsOpen && <nav className="world-tool-drawer" aria-label="세계관 메뉴">
      <p>WORLD MENU</p>
      <Link href={`/world/${world.id}/wiki`}>세계관 기록</Link>
      <Link href={`/world/${world.id}/wiki/new`}>새 기록 작성</Link>
      <Link href="/explore">다른 세계관</Link>
    </nav>}

    {yearOpen && <div className="year-dialog-backdrop" onMouseDown={() => setYearOpen(false)}>
      <section className="year-dialog" role="dialog" aria-modal="true" aria-labelledby="year-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="year-dialog-close" onClick={() => setYearOpen(false)} aria-label="닫기"><X /></button>
        <span>NEW TIMELINE</span>
        <h2 id="year-dialog-title">새 연도 타임라인 만들기</h2>
        <p>세계관 지도에 새로운 연도 지점을 추가합니다.</p>
        <form onSubmit={addYear}>
          <label htmlFor="timeline-year">연도</label>
          <input id="timeline-year" name="year" inputMode="numeric" placeholder="예: 2042" autoFocus required />
          <button type="submit">타임라인 만들기</button>
        </form>
      </section>
    </div>}
  </main>;
}
