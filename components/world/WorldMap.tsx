"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Plus, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { timeline, WikiArticle, wikiArticles, World } from "@/lib/data";
import { BranchTimeline } from "@/components/timeline/BranchTimeline";
import { AccountEntry } from "@/components/auth/AccountEntry";
import { useAuth } from "@/components/auth/AuthProvider";
import { originEventId, saveWorldFork, saveYear, type SavedWorld, type SavedYear, type WorldlineFork } from "@/lib/worlds/storage";

type SearchResult = { label: string; meta: string; href?: string };

type Workspace = { world: SavedWorld; years: SavedYear[]; forks: WorldlineFork[] };

export function WorldMap({ world, workspace }: { world: Pick<World, "id" | "name">; workspace?: Workspace }) {
  const { client } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [savedYears, setSavedYears] = useState(() => workspace?.years ?? []);
  const [yearError, setYearError] = useState("");
  const [yearBusy, setYearBusy] = useState(false);
  const savingYear = useRef(false);
  useEffect(() => {
    if (workspace) return;
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(`if:timeline-years:${world.id}`) ?? "[]");
      if (Array.isArray(stored)) setYears(stored.filter((year): year is string => typeof year === "string"));
    } catch { /* Ignore malformed or unavailable local storage. */ }
  }, [world.id, workspace]);
  const events = useMemo(() => {
    if (!workspace) return timeline;
    const saved = workspace.world;
    return [
      { id: originEventId, year: saved.start, title: "Point of origin", text: saved.description, x: 110, y: 90, important: true, articleIds: [] },
      ...savedYears.map((entry, index) => ({
        id: entry.id, year: entry.year, title: "Timeline point", text: `A point in the main worldline of ${saved.name}.`,
        x: 310 + index * 200, y: 90, important: false, articleIds: [],
      })),
    ];
  }, [workspace, savedYears]);
  const articles = useMemo(() => wikiArticles.filter((article) => article.worldId === world.id), [world.id]);
  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    const matchedEvents = events
      .filter((event) => `${event.year} ${event.title} ${event.text}`.toLocaleLowerCase().includes(term))
      .map((event) => ({ label: event.title, meta: `${event.year} · 사건` }));
    const records = articles
      .filter((article: WikiArticle) => `${article.title} ${article.type} ${article.summary}`.toLocaleLowerCase().includes(term))
      .map((article) => ({ label: article.title, meta: `${article.type} · 기록`, href: `/world/${world.id}/wiki/${article.id}` }));
    return [...matchedEvents, ...records].slice(0, 6);
  }, [articles, events, query, world.id]);

  async function addYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingYear.current) return;
    const form = new FormData(event.currentTarget);
    const year = String(form.get("year") || "").trim();
    if (!year) return;
    if (workspace) {
      if (!client) return;
      if (year === workspace.world.start || savedYears.some(entry => entry.year === year)) {
        setYearError("That timeline point already exists.");
        return;
      }
      savingYear.current = true;
      setYearBusy(true);
      setYearError("");
      try {
        const saved = await saveYear(client, world.id, year);
        setSavedYears(previous => previous.some(entry => entry.id === saved.id) ? previous : [...previous, saved]);
        setYearOpen(false);
      } catch {
        setYearError("Couldn’t save this timeline point. Try again.");
      } finally {
        savingYear.current = false;
        setYearBusy(false);
      }
      return;
    }
    const updated = [...years, year];
    setYears(updated);
    try { localStorage.setItem(`if:timeline-years:${world.id}`, JSON.stringify(updated)); }
    catch { /* The timeline remains available in this tab. */ }
    setYearOpen(false);
  }

  return <main className={workspace ? "world-map-shell world-map-shell--private" : "world-map-shell"}>
    <header className="world-map-header">
      <div className="world-map-identity">
        <Image src="/brand/if-logo.svg" alt="IF." width={52} height={52} priority />
        <div><span>{workspace ? "PRIVATE WORLD" : "ACTIVE WORLD"}</span><h1 title={world.name}>{world.name} <i>/</i> <b>{workspace?.world.start ?? "2036"}</b></h1></div>
      </div>
      <div className="world-search-wrap">
        <label className="world-search">
          <span className="sr-only">세계관 검색</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search years, events, people, places…" />
          <Search aria-hidden="true" />
        </label>
        {query && <div className="world-search-results">
          {results.length ? results.map((result, index) => result.href
            ? <Link key={`${result.label}-${index}`} href={result.href}><b>{result.label}</b><span>{result.meta}</span></Link>
            : <button key={`${result.label}-${index}`} onClick={() => setQuery(result.label)}><b>{result.label}</b><span>{result.meta}</span></button>)
            : <p>일치하는 기록이 없습니다.</p>}
        </div>}
      </div>
      <AccountEntry compact />
    </header>

    <section className="world-map-canvas" aria-label={`${world.name} 연도별 타임라인 지도`}>
      <BranchTimeline
        worldId={world.id} immersive additionalYears={years} events={events}
        savedForks={workspace?.forks} originRules={workspace?.world.rules}
        saveFork={workspace && client ? fork => saveWorldFork(client, fork) : undefined}
      />
    </section>

    <aside className={`world-map-toolbar ${toolsOpen ? "is-open" : ""}`} aria-label="지도 도구">
      <button className="toolbar-menu" onClick={() => setToolsOpen((open) => !open)} aria-expanded={toolsOpen} aria-label={toolsOpen ? "툴바 닫기" : "툴바 열기"}>{toolsOpen ? <X /> : <Menu />}</button>
      <button className="toolbar-add" onClick={() => { setYearError(""); setYearOpen(true); }} aria-label="새 연도 타임라인 만들기"><Plus /></button>
    </aside>
    {toolsOpen && <nav className="world-tool-drawer" aria-label="세계관 메뉴">
      <p>WORLD / NAVIGATION</p>
      {workspace ? <Link href="/profile#my-worlds">My worlds</Link> : <>
        <Link href={`/world/${world.id}/wiki`}>World archive</Link>
        <Link href={`/world/${world.id}/wiki/new`}>New record</Link>
      </>}
      <Link href="/explore">Explore worlds</Link>
    </nav>}

    {yearOpen && <div className="year-dialog-backdrop" onMouseDown={() => { if (!yearBusy) setYearOpen(false); }}>
      <section className="year-dialog" role="dialog" aria-modal="true" aria-labelledby="year-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="year-dialog-close" onClick={() => setYearOpen(false)} disabled={yearBusy} aria-label="닫기"><X /></button>
        <span>NEW TIMELINE</span>
        <h2 id="year-dialog-title">새 연도 타임라인 만들기</h2>
        <p>세계관 지도에 새로운 연도 지점을 추가합니다.</p>
        <form onSubmit={addYear}>
          <label htmlFor="timeline-year">연도</label>
          <input id="timeline-year" name="year" inputMode="numeric" placeholder="예: 2042" maxLength={80} disabled={yearBusy} autoFocus required />
          {yearError && <p className="fork-error" role="alert">{yearError}</p>}
          <button type="submit" disabled={yearBusy}>{yearBusy ? "저장 중…" : "타임라인 만들기"}</button>
        </form>
      </section>
    </div>}
  </main>;
}
