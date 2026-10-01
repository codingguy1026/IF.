"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

function CreateForm(){ const router=useRouter(), params=useSearchParams(); const [step,setStep]=useState(1); const [policy,setPolicy]=useState("REVIEW"); const [name,setName]=useState("");
 const submit=(e:FormEvent)=>{e.preventDefault(); if(step<2){setStep(2);return} localStorage.setItem("if:last-world",JSON.stringify({name,policy}));router.push("/world/luna-republic")};
 return <main className="create-page"><header><Link href="/explore"><ArrowLeft/> Exit</Link><span>CREATE A WORLD</span><b>0{step} / 02</b></header><div className="create-progress"><i style={{width:`${step*50}%`}}/></div><form onSubmit={submit}>
  {step===1?<section><span className="form-kicker">BEGIN / THE PREMISE</span><h1>Give this world<br/>a point of origin.</h1><p>Every history starts with a name and a question.</p><label>WORLD NAME<input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. The Lunar Republic" autoFocus/></label><label>SHORT DESCRIPTION<textarea required defaultValue={params.get("idea") ?? ""} placeholder="What makes this world different?"/></label><label>STARTING YEAR OR DATE<input required placeholder="e.g. 2026 or 14 March, 1862"/></label></section>:
  <section><span className="form-kicker">DEFINE / THE RULES</span><h1>How will history<br/>be written?</h1><p>Choose who can contribute. This can be changed later.</p><label>WORLD RULES<textarea required placeholder="Set the boundaries of canon, technology, or tone..."/></label><fieldset><legend>CONTRIBUTION POLICY</legend><div className="policy-grid">{[["OPEN","Anyone can contribute"],["REVIEW","Proposals need approval"],["INVITE ONLY","Approved members only"],["SOLO","Only you can edit"]].map(([p,d])=><button type="button" className={policy===p?"selected":""} onClick={()=>setPolicy(p)} key={p}><span>{p}</span><small>{d}</small>{policy===p&&<Check/>}</button>)}</div></fieldset><label>VISIBILITY<select><option>Public — visible to everyone</option><option>Unlisted — link access only</option><option>Private — members only</option></select></label></section>}
  <footer>{step>1?<button type="button" onClick={()=>setStep(1)} className="back">Back</button>:<span/>}<button className="continue">{step===1?"Continue":"Create world"}<ArrowRight/></button></footer></form></main>
}
export default function CreatePage(){return <Suspense><CreateForm/></Suspense>}
