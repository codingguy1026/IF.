"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { listWorlds, type SavedWorld } from "@/lib/worlds/storage";

export function MyWorlds() {
  const { user } = useAuth();
  return user ? <WorldList key={user.id} /> : null;
}

function WorldList() {
  const { client } = useAuth();
  const [worlds, setWorlds] = useState<SavedWorld[]>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!client) return;
    const request = new AbortController();
    void listWorlds(client, request.signal).then(data => {
      if (!request.signal.aborted) setWorlds(data);
    }).catch(() => {
      if (!request.signal.aborted) setFailed(true);
    });
    return () => request.abort();
  }, [client, attempt]);

  return <section className="record-section" id="my-worlds" aria-labelledby="my-worlds-title">
    <div className="record-heading"><span>PRIVATE ARCHIVE</span><h2 id="my-worlds-title">My worlds</h2></div>
    {failed ? <p role="alert">Couldn’t load your worlds. <button className="button-link" type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Try again</button></p>
      : !worlds ? <p role="status">Loading your worlds…</p>
      : worlds.length ? <div className="related-grid">{worlds.map(world => <Link key={world.id} href={`/world/${world.id}`}>
        <span>{world.start}</span><h3>{world.name}</h3><p>{world.description}</p>
      </Link>)}</div>
      : <p>You haven’t created a world yet.</p>}
    <Link className="button-link" href="/create">Create a world ↗</Link>
  </section>;
}
