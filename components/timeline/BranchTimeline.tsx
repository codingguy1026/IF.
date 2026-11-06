"use client";

import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { timeline } from "@/lib/data";

type Fork = {
  id: string;
  worldId: string;
  fromEventId: string;
  name: string;
  premise: string;
  createdAt: string;
};

const forkKey = (worldId: string) => `if:worldline-forks:${worldId}`;

function loadForks(worldId: string): Fork[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(forkKey(worldId)) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is Fork => (
      item !== null && typeof item === "object" &&
      typeof item.id === "string" && item.worldId === worldId &&
      typeof item.fromEventId === "string" && typeof item.name === "string" &&
      typeof item.premise === "string" && typeof item.createdAt === "string" &&
      timeline.some(event => event.id === item.fromEventId)
    ));
  } catch {
    return [];
  }
}

export function BranchTimeline({
  worldId = "luna-republic",
  immersive = false,
  additionalYears = [],
}: {
  worldId?: string;
  immersive?: boolean;
  additionalYears?: string[];
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(timeline[2]);
  const [forks, setForks] = useState<Fork[]>([]);
  const [selectedForkId, setSelectedForkId] = useState<string | null>(null);
  const [forkOpen, setForkOpen] = useState(false);
  const [name, setName] = useState("");
  const [premise, setPremise] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setForks(loadForks(worldId));
    setSelectedForkId(null);
  }, [worldId]);

  const selectedFork = forks.find(fork => fork.id === selectedForkId);
  const source = selectedFork ? timeline.find(event => event.id === selectedFork.fromEventId) : null;
  const viewHeight = Math.max(360, 405 + (forks.length - 1) * 90);

  function chooseEvent(event: typeof timeline[number]) {
    setSelected(event);
    setSelectedForkId(null);
  }

  function createFork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !premise.trim()) return;

    const fork: Fork = {
      id: `fork-${crypto.randomUUID()}`,
      worldId,
      fromEventId: selected.id,
      name: name.trim(),
      premise: premise.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...forks, fork];
    try {
      localStorage.setItem(forkKey(worldId), JSON.stringify(updated));
    } catch {
      setSaveError("분기를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.");
      return;
    }
    setForks(updated);
    setSelectedForkId(fork.id);
    setForkOpen(false);
    setName("");
    setPremise("");
    setSaveError("");
  }

  return <div className={`timeline-panel ${immersive ? "timeline-panel--immersive" : ""}`}>
    <div className="timeline-head">
      <div><span className="status-dot" /> MAIN WORLDLINE <span className="fork-count">/ {forks.length} NEW BRANCHES</span></div>
      <div className="timeline-tools">
        <button onClick={() => setZoom(v => Math.max(.7, v - .15))} aria-label="Zoom out"><Minus /></button>
        <button onClick={() => setZoom(v => Math.min(1.6, v + .15))} aria-label="Zoom in"><Plus /></button>
        <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} aria-label="Reset view"><RotateCcw /></button>
        <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} aria-label="Fit view"><Maximize2 /></button>
      </div>
    </div>
    <div className="timeline-canvas" onWheel={event => setZoom(v => Math.max(.7, Math.min(1.6, v - event.deltaY * .001)))}>
      <svg viewBox={`0 0 900 ${viewHeight}`} role="group" aria-label="Branching world timeline" style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}
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
        <path className="line" d="M110 90H710" />
        <path className="branch-line" d="M510 90C575 90 610 250 710 250" />
        <text x="610" y="220" className="branch-label">FEDERATION LINE</text>

        {forks.map((fork, index) => {
          const origin = timeline.find(item => item.id === fork.fromEventId)!;
          const y = 350 + index * 90;
          const targetX = Math.max(790, origin.x + 90);
          const firstControl = Math.min(targetX - 35, origin.x + 85);
          return <path key={`path-${fork.id}`} className="branch-line fork-path"
            d={`M${origin.x} ${origin.y} C${firstControl} ${origin.y} ${targetX - 65} ${y} ${targetX} ${y}`} />;
        })}

        {timeline.map(item => <g key={item.id} className={`event-node ${!selectedForkId && selected.id === item.id ? "selected" : ""}`}
          onClick={event => { event.stopPropagation(); chooseEvent(item); }}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseEvent(item); } }}
          role="button" tabIndex={0} aria-label={`${item.year}: ${item.title}`}>
          <circle cx={item.x} cy={item.y} r={item.important ? 10 : 7} />
          <text x={item.x} y={item.y - 29} textAnchor="middle" className="event-year">{item.year}</text>
          <text x={item.x} y={item.y + 34} textAnchor="middle" className="event-title">{item.title}</text>
        </g>)}

        {additionalYears.map((year, index) => <g key={`${year}-${index}`} className="event-node newly-created">
          <circle cx={790 + index * 100} cy="90" r="7" />
          <text x={790 + index * 100} y="61" textAnchor="middle" className="event-year">{year}</text>
          <text x={790 + index * 100} y="124" textAnchor="middle" className="event-title">New timeline</text>
        </g>)}

        {forks.map((fork, index) => {
          const origin = timeline.find(item => item.id === fork.fromEventId)!;
          const x = Math.max(790, origin.x + 90);
          const y = 350 + index * 90;
          return <g key={fork.id} className={`event-node fork-node newly-created ${selectedForkId === fork.id ? "selected" : ""}`}
            onClick={event => { event.stopPropagation(); setSelectedForkId(fork.id); }}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedForkId(fork.id); } }}
            role="button" tabIndex={0} aria-label={`Parallel worldline: ${fork.name}`}>
            <circle cx={x} cy={y} r="9" />
            <text x={x} y={y - 28} textAnchor="middle" className="event-year">ALT / {origin.year}</text>
            <text x={x} y={y + 30} textAnchor="middle" className="event-title">{fork.name.length > 27 ? `${fork.name.slice(0, 24)}…` : fork.name}</text>
          </g>;
        })}
      </svg>
    </div>
    <div className="event-inspector">
      <div>
        <span>{selectedFork ? `PARALLEL WORLDLINE / ${source?.year ?? ""}` : selected.year}</span>
        <h3>{selectedFork ? selectedFork.name : selected.title}</h3>
        <p>{selectedFork ? selectedFork.premise : selected.text}</p>
        {selectedFork && <p className="fork-origin">ORIGIN · {source?.title}</p>}
        {!selectedFork && selected.articleIds.length > 0 && <div className="event-records"><b>LINKED WIKI</b>{selected.articleIds.map(id => <Link key={id} href={`/world/${worldId}/wiki/${id}`}>{id.replaceAll("-", " ")} ↗</Link>)}</div>}
      </div>
      {selectedFork
        ? <button type="button" onClick={() => { if (source) chooseEvent(source); }}>View origin ↗</button>
        : <button type="button" onClick={() => { setSaveError(""); setForkOpen(true); }}>Fork from here <span>↗</span></button>}
    </div>
    {forkOpen && <div className="year-dialog-backdrop" onMouseDown={() => setForkOpen(false)}>
      <section className="year-dialog fork-dialog" role="dialog" aria-modal="true" aria-labelledby="fork-dialog-title" onMouseDown={event => event.stopPropagation()}>
        <button type="button" className="year-dialog-close" onClick={() => setForkOpen(false)} aria-label="닫기"><X /></button>
        <span>CREATE / PARALLEL WORLDLINE</span>
        <h2 id="fork-dialog-title">새로운 역사를 시작합니다.</h2>
        <p><strong>{selected.year} · {selected.title}</strong> 사건에서 다른 가능성으로 분기합니다. 원본 세계의 기록은 변경되지 않아요.</p>
        <form onSubmit={createFork}>
          <label htmlFor="fork-name">분기 이름</label>
          <input id="fork-name" maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="예: Independence Never Happened" autoFocus required />
          <label htmlFor="fork-premise">무엇이 달라지나요?</label>
          <textarea id="fork-premise" maxLength={500} value={premise} onChange={event => setPremise(event.target.value)} placeholder="이 세계에서는 어떤 선택이 달라졌나요?" required />
          {saveError && <p className="fork-error" role="alert">{saveError}</p>}
          <button type="submit">Create worldline ↗</button>
        </form>
      </section>
    </div>}
  </div>;
}
