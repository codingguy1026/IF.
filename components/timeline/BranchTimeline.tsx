"use client";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { timeline } from "@/lib/data";
import Link from "next/link";

export function BranchTimeline({worldId="luna-republic", immersive=false, additionalYears=[]}:{worldId?:string;immersive?:boolean;additionalYears?:string[]}) {
 const [zoom,setZoom]=useState(1); const [offset,setOffset]=useState({x:0,y:0}); const [selected,setSelected]=useState(timeline[2]);
 return <div className={`timeline-panel ${immersive ? "timeline-panel--immersive" : ""}`}>
  <div className="timeline-head"><div><span className="status-dot"/> MAIN WORLDLINE</div><div className="timeline-tools"><button onClick={()=>setZoom(v=>Math.max(.7,v-.15))} aria-label="Zoom out"><Minus/></button><button onClick={()=>setZoom(v=>Math.min(1.6,v+.15))} aria-label="Zoom in"><Plus/></button><button onClick={()=>{setZoom(1);setOffset({x:0,y:0})}} aria-label="Reset view"><RotateCcw/></button><button aria-label="Fit view"><Maximize2/></button></div></div>
  <div className="timeline-canvas" onWheel={e=>{e.preventDefault();setZoom(v=>Math.max(.7,Math.min(1.6,v-e.deltaY*.001)))}}>
   <svg viewBox="0 0 900 360" role="img" aria-label="Branching world timeline" style={{transform:`translate(${offset.x}px,${offset.y}px) scale(${zoom})`}} onPointerDown={e=>{const sx=e.clientX,sy=e.clientY,o=offset; const move=(m:PointerEvent)=>setOffset({x:o.x+m.clientX-sx,y:o.y+m.clientY-sy}); const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up)}}>
    <path className="line" d="M110 90H710"/><path className="branch-line" d="M510 90C575 90 610 250 710 250"/><text x="610" y="220" className="branch-label">FEDERATION LINE</text>
    {timeline.map(e=><g key={e.id} className={`event-node ${selected.id===e.id?'selected':''}`} onClick={ev=>{ev.stopPropagation();setSelected(e)}} role="button" tabIndex={0}>
      <circle cx={e.x} cy={e.y} r={e.important?10:7}/><text x={e.x} y={e.y-29} textAnchor="middle" className="event-year">{e.year}</text><text x={e.x} y={e.y+34} textAnchor="middle" className="event-title">{e.title}</text>
    </g>)}
    {additionalYears.map((year,index)=><g key={`${year}-${index}`} className="event-node newly-created"><circle cx={790+index*100} cy="90" r="7"/><text x={790+index*100} y="61" textAnchor="middle" className="event-year">{year}</text><text x={790+index*100} y="124" textAnchor="middle" className="event-title">New timeline</text></g>)}
   </svg>
  </div>
  <div className="event-inspector"><div><span>{selected.year}</span><h3>{selected.title}</h3><p>{selected.text}</p>{selected.articleIds.length>0&&<div className="event-records"><b>LINKED WIKI</b>{selected.articleIds.map(id=><Link key={id} href={`/world/${worldId}/wiki/${id}`}>{id.replaceAll("-"," ")} ↗</Link>)}</div>}</div><button>Fork from here <span>↗</span></button></div>
 </div>;
}
