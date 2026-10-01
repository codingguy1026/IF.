"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CSSProperties, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

function CreateForm() {
  const router=useRouter(), params=useSearchParams();
  const [step,setStep]=useState(1), [policy,setPolicy]=useState("REVIEW"), [name,setName]=useState(""), [start,setStart]=useState(""), [origin,setOrigin]=useState(false);
  const originTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(originTimer.current)clearTimeout(originTimer.current)},[]);
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(step<2){setStep(2);return}
    if(origin)return;
    setOrigin(true);
    localStorage.setItem("if:last-world",JSON.stringify({name,policy,start}));
    const duration=window.matchMedia("(prefers-reduced-motion: reduce)").matches?80:1450;
    originTimer.current=setTimeout(()=>router.push("/world/luna-republic"),duration);
  }
  return <main className={`create-page entrance-sequence ${origin?"origin-active":""}`}>
    <header><Link href="/explore"><ArrowLeft/> Exit</Link><span>CREATE A WORLD</span><b>0{step} / 02</b></header>
    <div className="create-progress"><i style={{width:`${step*50}%`}}/></div>
    <form onSubmit={submit}>
      {step===1?<section>
        <span className="form-kicker reveal-kicker">BEGIN / THE PREMISE</span><h1 className="reveal-title">Give this world<br/>a point of origin.</h1><p className="reveal-copy">Every history starts with a name and a question.</p>
        <label className={`motion-field ${name?"is-complete":""}`}><span>WORLD NAME</span><input required value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. The Lunar Republic" autoFocus/><i/></label>
        <label className="motion-field"><span>SHORT DESCRIPTION</span><textarea required defaultValue={params.get("idea") ?? ""} placeholder="What makes this world different?"/><i/></label>
        <label className={`motion-field date-field ${start?"is-complete":""}`}><span>STARTING YEAR OR DATE</span><input required value={start} onChange={event=>setStart(event.target.value)} placeholder="e.g. 2026 or 14 March, 1862"/><i/><span className="date-coordinate" style={{"--date-progress":`${Math.min(start.length/16,1)*100}%`} as CSSProperties}><b/><em>ORIGIN</em></span></label>
      </section>:<section>
        <span className="form-kicker reveal-kicker">DEFINE / THE RULES</span><h1 className="reveal-title">How will history<br/>be written?</h1><p className="reveal-copy">Choose who can contribute. This can be changed later.</p>
        <label className="motion-field"><span>WORLD RULES</span><textarea required placeholder="Set the boundaries of canon, technology, or tone..."/><i/></label>
        <fieldset><legend>CONTRIBUTION POLICY</legend><div className="policy-grid">{[["OPEN","Anyone can contribute"],["REVIEW","Proposals need approval"],["INVITE ONLY","Approved members only"],["SOLO","Only you can edit"]].map(([p,d])=><button type="button" className={policy===p?"selected":""} onClick={()=>setPolicy(p)} key={p}><span>{p}</span><small>{d}</small>{policy===p&&<Check/>}</button>)}</div></fieldset>
        <label className="motion-field"><span>VISIBILITY</span><select><option>Public — visible to everyone</option><option>Unlisted — link access only</option><option>Private — members only</option></select><i/></label>
      </section>}
      <footer>{step>1?<button type="button" onClick={()=>setStep(1)} className="back">Back</button>:<span/>}<button className="continue" disabled={origin}><span>{step===1?"Continue":"Create world"}</span><ArrowRight/><i className="origin-point"/></button></footer>
    </form>
    <div className="origin-sequence" aria-hidden={!origin}><div className="origin-core"><i/><i/><i/><b/></div><strong>{name || "Untitled World"}</strong><span>ORIGIN ESTABLISHED</span></div>
  </main>;
}

export default function CreatePage(){return <Suspense><CreateForm/></Suspense>}
