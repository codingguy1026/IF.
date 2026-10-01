"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { articleTypes, branches } from "@/lib/data";

export function NewArticleForm({ worldId }: { worldId:string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    localStorage.setItem(`if:wiki-draft:${worldId}`, JSON.stringify({...values, createdAt:new Date().toISOString()}));
    setSaved(true);
    setTimeout(()=>router.push(`/world/${worldId}/wiki`), 650);
  }
  return <main className="create-page wiki-create">
    <header><Link href={`/world/${worldId}/wiki`}><ArrowLeft/> Return to archive</Link><span>NEW WIKI RECORD</span></header>
    <form onSubmit={submit}>
      <section><span className="form-kicker">WORLD ARCHIVE / DRAFT</span><h1>Record something<br/>that matters.</h1><p>Create a branch-aware entry. It will remain a local draft until the archive database is connected.</p></section>
      <label htmlFor="title">Article title</label><input id="title" name="title" required placeholder="e.g. Artemis Transit Authority" />
      <div className="form-split"><div><label htmlFor="type">Record type</label><select id="type" name="type">{articleTypes.map(type=><option key={type}>{type}</option>)}</select></div><div><label htmlFor="branch">Worldline</label><select id="branch" name="branch">{branches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div></div>
      <label htmlFor="summary">Summary</label><textarea id="summary" name="summary" required placeholder="A concise definition of this record…" />
      <label htmlFor="content">Archive text</label><textarea className="content-field" id="content" name="content" required placeholder="Write the first section…" />
      <footer><span className="draft-note">{saved ? "Draft saved to this device." : "Status · Proposed"}</span><button className="continue" type="submit">Save draft <ArrowRight/></button></footer>
    </form>
  </main>;
}
