"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { WorldMap } from "@/components/world/WorldMap";
import { loadWorld } from "@/lib/worlds/storage";
import type { TimelineSelection } from "@/lib/newspaper/worldlines";

type Workspace = NonNullable<Awaited<ReturnType<typeof loadWorld>>>;

function WorldWorkspace({ id, initialSelection }: { id: string; initialSelection?: TimelineSelection }) {
  const { client, user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!client || !userId) return;
    const request = new AbortController();
    void loadWorld(client, id, request.signal).then(result => {
      if (!request.signal.aborted) setWorkspace(result);
    }).catch(() => {
      if (!request.signal.aborted) setError(true);
    });
    return () => request.abort();
  }, [client, id, userId, attempt]);

  if (error) return <main className="auth-gate">
    <span>IF. / WORLDLINE STORAGE</span><h1>Couldn’t load this world.</h1>
    <button className="button-link" type="button" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button>
  </main>;
  if (workspace === undefined) return <main className="auth-gate"><span>IF. / WORLDLINE STORAGE</span><h1>Loading world…</h1></main>;
  if (!workspace) return <main className="auth-gate">
    <span>IF. / WORLDLINE STORAGE</span><h1>World not found.</h1><Link href="/profile#my-worlds">Return to my worlds ↗</Link>
  </main>;

  return <WorldMap world={workspace.world} workspace={workspace} initialSelection={initialSelection} />;
}

function ScopedWorld({ id, initialSelection }: { id: string; initialSelection?: TimelineSelection }) {
  const { user } = useAuth();
  return <WorldWorkspace key={`${user?.id}:${id}`} id={id} initialSelection={initialSelection} />;
}

export function PrivateWorld({ id, initialSelection }: { id: string; initialSelection?: TimelineSelection }) {
  return <RequireAuth next={`/world/${id}`}><ScopedWorld id={id} initialSelection={initialSelection} /></RequireAuth>;
}
