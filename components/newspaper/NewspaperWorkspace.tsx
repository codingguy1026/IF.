"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { timeline, worldById } from "@/lib/data";
import { eventPath, newspaperPath, type NewspaperRef, type NewspaperScope } from "@/lib/newspaper/model";
import { eventsForWorldline, loadBrowserForks, worldlineOptions } from "@/lib/newspaper/worldlines";
import { loadWorld, worldEvents, type WorldlineFork } from "@/lib/worlds/storage";
import { NewspaperView } from "./NewspaperView";

type Context = { worldName: string; worldlineName: string; event: typeof timeline[number]; scope: NewspaperScope; canCreate: boolean };

function Workspace({ reference, edit }: { reference: NewspaperRef; edit: boolean }) {
  const { client } = useAuth();
  const [context, setContext] = useState<Context | null>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { worldId, worldlineId, eventId } = reference;

  useEffect(() => {
    const request = new AbortController();
    void (async () => {
      try {
        const demoWorld = worldById(worldId);
        const workspace = demoWorld ? null : await loadWorld(client!, worldId, request.signal);
        if (!demoWorld && !workspace) {
          if (!request.signal.aborted) setContext(null);
          return;
        }
        const builtInLine = worldlineId === "main" || worldlineId === "federation";
        const forks: WorldlineFork[] = demoWorld ? builtInLine ? [] : loadBrowserForks(worldId) : workspace!.forks;
        const events = demoWorld ? timeline : worldEvents(workspace!.world, workspace!.years);
        const worldline = worldlineOptions(forks, Boolean(demoWorld)).find(line => line.id === worldlineId);
        const event = eventsForWorldline(events, worldlineId, forks, Boolean(demoWorld)).find(item => item.id === eventId);
        if (!request.signal.aborted) setContext(worldline && event ? {
          worldName: (demoWorld ?? workspace!.world).name,
          worldlineName: worldline.name, event, scope: demoWorld ? "browser" : "account",
          canCreate: !demoWorld || forks.some(fork => fork.id === worldlineId),
        } : null);
      } catch {
        if (!request.signal.aborted) setError(true);
      }
    })();
    return () => request.abort();
  }, [client, worldId, worldlineId, eventId, attempt]);

  if (error) return <main className="newspaper-state">
    <h1>Couldn’t load this newspaper.</h1><p>Check your connection and try again.</p>
    <button onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button>
    <Link href={eventPath(reference)}>Back to timeline</Link>
  </main>;
  if (context === undefined) return <main className="newspaper-state" role="status">Loading newspaper…</main>;
  if (!context) return <main className="newspaper-state">
    <h1>Event not found in this worldline.</h1>
    <p>The world may be private, or this event may belong to a different worldline.</p>
    <Link href={eventPath(reference)}>Back to timeline</Link>
  </main>;
  return <NewspaperView reference={reference} context={context} edit={edit} />;
}

export function NewspaperWorkspace({ reference, edit }: { reference: NewspaperRef; edit: boolean }) {
  const { user } = useAuth();
  const demo = Boolean(worldById(reference.worldId));
  const workspace = <Workspace key={`${demo ? "browser" : user?.id}:${newspaperPath(reference)}`} reference={reference} edit={edit} />;
  return demo ? workspace : <RequireAuth next={`${newspaperPath(reference)}${edit ? "?edit=1" : ""}`}>{workspace}</RequireAuth>;
}
