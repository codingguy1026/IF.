"use client";

import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { timeline } from "@/lib/data";
import { NewspaperAction } from "@/components/newspaper/NewspaperAction";
import { eventPath } from "@/lib/newspaper/model";
import { eventsForWorldline, forkKey, loadBrowserForks, worldlineOptions, type TimelineSelection } from "@/lib/newspaper/worldlines";
import type { WorldlineFork as Fork } from "@/lib/worlds/storage";

export function BranchTimeline({
  worldId = "luna-republic",
  immersive = false,
  additionalYears = [],
  events = timeline,
  savedForks,
  saveFork,
  originRules,
  initialSelection,
}: {
  worldId?: string;
  immersive?: boolean;
  additionalYears?: string[];
  events?: typeof timeline;
  savedForks?: Fork[];
  saveFork?: (fork: Fork) => Promise<Fork>;
  originRules?: string;
  initialSelection?: TimelineSelection;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const hasDemoEvents = events === timeline;
  const firstEvent = hasDemoEvents ? timeline[2] : events[0];
  const [selectedId, setSelectedId] = useState(initialSelection?.eventId ?? firstEvent.id);
  const [worldlineId, setWorldlineId] = useState(initialSelection?.worldlineId ?? "main");
  const [forks, setForks] = useState<Fork[]>(() => savedForks ?? []);
  const [selectedForkId, setSelectedForkId] = useState<string | null>(null);
  const [forkOpen, setForkOpen] = useState(false);
  const [name, setName] = useState("");
  const [premise, setPremise] = useState("");
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const draftId = useRef<string | null>(null);

  useEffect(() => {
    try { setForks(savedForks ?? loadBrowserForks(worldId)); }
    catch { setForks([]); }
  }, [worldId, savedForks]);

  const lines = worldlineOptions(forks, hasDemoEvents);
  const resolvedLine = lines.find(line => line.id === worldlineId);
  const activeLine = resolvedLine ?? { id: worldlineId, name: "Worldline unavailable" };
  const lineEvents = eventsForWorldline(events, activeLine.id, forks, hasDemoEvents);
  const selected = lineEvents.find(event => event.id === selectedId) ?? lineEvents.at(-1) ?? firstEvent;
  const eventsById = new Map(events.map(event => [event.id, event]));
  const selectedFork = forks.find(fork => fork.id === selectedForkId);
  const source = selectedFork ? eventsById.get(selectedFork.fromEventId) : null;
  const lastEventX = events.at(-1)?.x ?? 110;
  const viewWidth = Math.max(900, lastEventX + 200, 800 + additionalYears.length * 100);
  const viewHeight = Math.max(360, 405 + (forks.length - 1) * 90);

  function chooseEvent(event: typeof timeline[number]) {
    const nextLine = lineEvents.some(item => item.id === event.id) ? activeLine.id : hasDemoEvents && event.id === "e5" ? "federation" : "main";
    selectContext(nextLine, event.id);
    setSelectedForkId(null);
  }

  function selectContext(nextLine: string, eventId: string) {
    setWorldlineId(nextLine);
    setSelectedId(eventId);
    // Keep refresh/back links scoped to the actual selection without remounting the map.
    if (immersive) window.history.replaceState(null, "", eventPath({ worldId, worldlineId: nextLine, eventId }));
  }

  function chooseFork(fork: Fork) {
    selectContext(fork.id, fork.fromEventId);
    setSelectedForkId(fork.id);
  }

  async function createFork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || !name.trim() || !premise.trim()) return;

    const fork: Fork = {
      id: draftId.current ??= crypto.randomUUID(),
      worldId,
      fromEventId: selected.id,
      name: name.trim(),
      premise: premise.trim(),
      createdAt: new Date().toISOString(),
    };
    saving.current = true;
    setBusy(true);
    setSaveError("");
    try {
      if (savedForks && !saveFork) throw new Error("No account connection");
      const saved = saveFork ? await saveFork(fork) : fork;
      if (!saveFork) localStorage.setItem(forkKey(worldId), JSON.stringify([...forks, saved]));
      setForks(previous => previous.some(item => item.id === saved.id) ? previous : [...previous, saved]);
      chooseFork(saved);
      setForkOpen(false);
      setName("");
      setPremise("");
      draftId.current = null;
    } catch {
      setSaveError("분기를 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <div className={`timeline-panel ${immersive ? "timeline-panel--immersive" : ""}`}>
    <div className="timeline-head">
      <label className="timeline-worldline"><span className="status-dot" /><span className="sr-only">Worldline</span>
        <select aria-label="Worldline" value={activeLine.id} onChange={event => {
          const nextEvents = eventsForWorldline(events, event.target.value, forks, hasDemoEvents);
          selectContext(event.target.value, nextEvents.find(item => item.id === selected.id)?.id ?? nextEvents.at(-1)?.id ?? firstEvent.id);
          setSelectedForkId(null);
        }}>
          {!resolvedLine && <option value={worldlineId} disabled>Worldline unavailable</option>}
          {lines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
        </select>
      </label>
      <div className="timeline-tools">
        <button onClick={() => setZoom(v => Math.max(.7, v - .15))} aria-label="Zoom out"><Minus /></button>
        <button onClick={() => setZoom(v => Math.min(1.6, v + .15))} aria-label="Zoom in"><Plus /></button>
        <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} aria-label="Reset view"><RotateCcw /></button>
        <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} aria-label="Fit view"><Maximize2 /></button>
      </div>
    </div>
    <div className="timeline-canvas" onWheel={event => setZoom(v => Math.max(.7, Math.min(1.6, v - event.deltaY * .001)))}>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="group" aria-label="Branching world timeline" style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}
        onPointerDown={event => {
          if ((event.target as Element).closest(".event-node")) return;
          const sx = event.clientX, sy = event.clientY, previous = offset;
          const move = (next: PointerEvent) => setOffset({ x: previous.x + next.clientX - sx, y: previous.y + next.clientY - sy });
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}>
        <path className="line" d={`M110 90H${Math.max(230, lastEventX + (hasDemoEvents ? 0 : 32))}`} />
        {hasDemoEvents && <>
          <path className="branch-line" d="M510 90C575 90 610 250 710 250" />
          <text x="610" y="220" className="branch-label">FEDERATION LINE</text>
        </>}

        {forks.map((fork, index) => {
          const origin = eventsById.get(fork.fromEventId);
          if (!origin) return null;
          const y = 350 + index * 90;
          const targetX = Math.max(790, origin.x + 90);
          const firstControl = Math.min(targetX - 35, origin.x + 85);
          return <path key={`path-${fork.id}`} className="branch-line fork-path"
            d={`M${origin.x} ${origin.y} C${firstControl} ${origin.y} ${targetX - 65} ${y} ${targetX} ${y}`} />;
        })}

        {events.map(item => <g key={item.id} className={`event-node ${lineEvents.some(event => event.id === item.id) ? "" : "event-node--outside"} ${!selectedForkId && selected.id === item.id ? "selected" : ""}`}
          onClick={event => { event.stopPropagation(); chooseEvent(item); }}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseEvent(item); } }}
          role="button" tabIndex={0} aria-label={`${item.year}: ${item.title}`}>
          <circle cx={item.x} cy={item.y} r={item.important ? 10 : 7} />
          <text x={item.x} y={item.y - 29} textAnchor="middle" className="event-year">{item.year.length > 21 ? `${item.year.slice(0, 20)}…` : item.year}</text>
          <text x={item.x} y={item.y + 34} textAnchor="middle" className="event-title">{item.title}</text>
        </g>)}

        {additionalYears.map((year, index) => <g key={`${year}-${index}`} className="event-node newly-created">
          <circle cx={790 + index * 100} cy="90" r="7" />
          <text x={790 + index * 100} y="61" textAnchor="middle" className="event-year">{year}</text>
          <text x={790 + index * 100} y="124" textAnchor="middle" className="event-title">New timeline</text>
        </g>)}

        {forks.map((fork, index) => {
          const origin = eventsById.get(fork.fromEventId);
          if (!origin) return null;
          const x = Math.max(790, origin.x + 90);
          const y = 350 + index * 90;
          return <g key={fork.id} className={`event-node fork-node newly-created ${selectedForkId === fork.id ? "selected" : ""}`}
            onClick={event => { event.stopPropagation(); chooseFork(fork); }}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseFork(fork); } }}
            role="button" tabIndex={0} aria-label={`Parallel worldline: ${fork.name}`}>
            <circle cx={x} cy={y} r="9" />
            <text x={x} y={y - 28} textAnchor="middle" className="event-year">ALT / {origin.year}</text>
            <text x={x} y={y + 30} textAnchor="middle" className="event-title">{fork.name.length > 27 ? `${fork.name.slice(0, 24)}…` : fork.name}</text>
          </g>;
        })}
      </svg>
    </div>
    <div className="event-inspector" id="event-details">
      <div>
        <span>{activeLine.name} / {selectedFork ? source?.year : selected.year}</span>
        <h3>{resolvedLine ? selectedFork ? selectedFork.name : selected.title : "Choose a worldline"}</h3>
        <p>{resolvedLine ? selectedFork ? selectedFork.premise : selected.text : "This worldline may not be available in this browser or account."}</p>
        {!selectedFork && selected.id === "origin" && originRules && <details className="world-rules"><summary>World rules</summary><div>{originRules}</div></details>}
        {selectedFork && <p className="fork-origin">ORIGIN · {source?.title}</p>}
        {resolvedLine && !selectedFork && selected.articleIds.length > 0 && <div className="event-records"><b>LINKED WIKI</b>{selected.articleIds.map(id => <Link key={id} href={`/world/${worldId}/wiki/${id}`}>{id.replaceAll("-", " ")} ↗</Link>)}</div>}
      </div>
      {resolvedLine && <div className="event-inspector-actions">
        <NewspaperAction reference={{ worldId, worldlineId: activeLine.id, eventId: selectedFork ? source?.id ?? selected.id : selected.id }} scope={savedForks ? "account" : "browser"} canCreate={Boolean(savedForks) || forks.some(fork => fork.id === activeLine.id)} />
        {selectedFork
          ? <button type="button" onClick={() => { if (source) chooseEvent(source); }}>View event ↗</button>
          : <button type="button" onClick={() => { setSaveError(""); setForkOpen(true); }}>Fork from here <span>↗</span></button>}
      </div>}
    </div>
    {forkOpen && <div className="year-dialog-backdrop" onMouseDown={() => { if (!busy) setForkOpen(false); }}>
      <section className="year-dialog fork-dialog" role="dialog" aria-modal="true" aria-labelledby="fork-dialog-title" onMouseDown={event => event.stopPropagation()}>
        <button type="button" className="year-dialog-close" onClick={() => setForkOpen(false)} disabled={busy} aria-label="닫기"><X /></button>
        <span>CREATE / PARALLEL WORLDLINE</span>
        <h2 id="fork-dialog-title">새로운 역사를 시작합니다.</h2>
        <p><strong>{selected.year} · {selected.title}</strong> 사건에서 다른 가능성으로 분기합니다. 원본 세계의 기록은 변경되지 않아요.</p>
        <form onSubmit={createFork}>
          <label htmlFor="fork-name">분기 이름</label>
          <input id="fork-name" maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="예: Independence Never Happened" disabled={busy} autoFocus required />
          <label htmlFor="fork-premise">무엇이 달라지나요?</label>
          <textarea id="fork-premise" maxLength={500} value={premise} onChange={event => setPremise(event.target.value)} placeholder="이 세계에서는 어떤 선택이 달라졌나요?" disabled={busy} required />
          {saveError && <p className="fork-error" role="alert">{saveError}</p>}
          <button type="submit" disabled={busy}>{busy ? "Saving…" : "Create worldline ↗"}</button>
        </form>
      </section>
    </div>}
  </div>;
}
