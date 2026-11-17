"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CSSProperties, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import type { World } from "@/lib/data";
import { createWorld } from "@/lib/worlds/storage";

const policies = [
  ["OPEN", "Anyone can contribute"], ["REVIEW", "Proposals need approval"],
  ["INVITE ONLY", "Approved members only"], ["SOLO", "Only you can edit"],
] as const;

type LegacyDraft = { name: string; start: string; policy: World["policy"] };

function readLegacyDraft(userId: string): LegacyDraft | null {
  try {
    const raw = localStorage.getItem(`if:last-world:${userId}`);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (typeof draft?.name === "string" && typeof draft.start === "string" &&
        policies.some(([policy]) => policy === draft.policy)) {
      return { name: draft.name.slice(0, 100), start: draft.start.slice(0, 80), policy: draft.policy };
    }
  } catch { /* The create form is available when old browser storage can't be read. */ }
  return null;
}

function CreateForm() {
  const router=useRouter(), params=useSearchParams();
  const { client, user } = useAuth();
  const [step,setStep]=useState(1), [policy,setPolicy]=useState<World["policy"]>("REVIEW"), [name,setName]=useState(""), [start,setStart]=useState(""), [origin,setOrigin]=useState(false);
  const [description, setDescription] = useState(() => (params.get("idea") ?? "").slice(0, 300));
  const [rules, setRules] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [legacy, setLegacy] = useState<LegacyDraft | null>(null);
  const saving = useRef(false);
  const draftId = useRef<string | null>(null);
  const originTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(originTimer.current)clearTimeout(originTimer.current)},[]);
  const userId = user?.id;
  useEffect(() => {
    setLegacy(userId ? readLegacyDraft(userId) : null);
  }, [userId]);

  function restoreDraft() {
    if (!legacy) return;
    setName(legacy.name);
    setStart(legacy.start);
    setPolicy(legacy.policy);
    setLegacy(null);
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    setError("");
    if (step === 1) {
      if (![name, description, start].every(value => value.trim())) {
        setError("Enter a world name, description, and starting date.");
        return;
      }
      setStep(2);
      return;
    }
    if (!rules.trim()) { setError("Enter the rules of your world."); return; }
    if (!client || !user) return;

    const id = draftId.current ??= crypto.randomUUID();
    saving.current = true;
    setBusy(true);
    try {
      await createWorld(client, {
        id, name: name.trim(), description: description.trim(),
        start: start.trim(), rules: rules.trim(), policy,
      });
    } catch {
      saving.current = false;
      setBusy(false);
      setError("Couldn’t save this world. Your draft is still here. Try again.");
      return;
    }
    setOrigin(true);
    const duration=window.matchMedia("(prefers-reduced-motion: reduce)").matches?80:1450;
    originTimer.current=setTimeout(()=>router.push(`/world/${id}`),duration);
  }
  return <main className={`create-page entrance-sequence ${origin?"origin-active":""}`}>
    <header><Link href="/explore"><ArrowLeft/> Exit</Link><span>CREATE A WORLD</span><b>0{step} / 02</b></header>
    <div className="create-progress"><i style={{width:`${step*50}%`}}/></div>
    <form onSubmit={submit}>
      {step===1?<section>
        <span className="form-kicker reveal-kicker">BEGIN / THE PREMISE</span><h1 className="reveal-title">Give this world<br/>a point of origin.</h1><p className="reveal-copy">Every history starts with a name and a question.</p>
        {legacy && !name && !start && <button className="button-link" type="button" onClick={restoreDraft}>Restore previous draft ↗</button>}
        <label className={`motion-field ${name?"is-complete":""}`}><span>WORLD NAME</span><input required maxLength={100} value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. The Lunar Republic" autoFocus/><i/></label>
        <label className="motion-field"><span>SHORT DESCRIPTION</span><textarea required maxLength={300} value={description} onChange={event=>setDescription(event.target.value)} placeholder="What makes this world different?"/><i/></label>
        <label className={`motion-field date-field ${start?"is-complete":""}`}><span>STARTING YEAR OR DATE</span><input required maxLength={80} value={start} onChange={event=>setStart(event.target.value)} placeholder="e.g. 2026 or 14 March, 1862"/><i/><span className="date-coordinate" style={{"--date-progress":`${Math.min(start.length/16,1)*100}%`} as CSSProperties}><b/><em>ORIGIN</em></span></label>
      </section>:<section>
        <span className="form-kicker reveal-kicker">DEFINE / THE RULES</span><h1 className="reveal-title">How will history<br/>be written?</h1><p className="reveal-copy">Your world is private to your IF. Account. You can save a contribution preference for future sharing.</p>
        <label className="motion-field"><span>WORLD RULES</span><textarea required maxLength={1500} value={rules} onChange={event=>setRules(event.target.value)} disabled={busy} placeholder="Set the boundaries of canon, technology, or tone..."/><i/></label>
        <fieldset disabled={busy}><legend>CONTRIBUTION PREFERENCE</legend><div className="policy-grid">{policies.map(([p,d])=><button type="button" aria-pressed={policy===p} className={policy===p?"selected":""} onClick={()=>setPolicy(p)} key={p}><span>{p}</span><small>{d}</small>{policy===p&&<Check/>}</button>)}</div></fieldset>
      </section>}
      {error && <p className="fork-error" role="alert">{error}</p>}
      <footer>{step>1?<button type="button" disabled={busy} onClick={()=>{setError("");setStep(1)}} className="back">Back</button>:<span/>}<button className="continue" disabled={busy}><span>{step===1?"Continue":busy?"Saving…":"Create world"}</span><ArrowRight/><i className="origin-point"/></button></footer>
    </form>
    <div className="origin-sequence" aria-hidden={!origin}><div className="origin-core"><i/><i/><i/><b/></div><strong>{name || "Untitled World"}</strong><span>ORIGIN ESTABLISHED</span></div>
  </main>;
}

export default function CreatePage(){return <RequireAuth next="/create"><Suspense><CreateForm/></Suspense></RequireAuth>;}
