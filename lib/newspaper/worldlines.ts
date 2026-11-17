import { branches, timeline } from "@/lib/data";
import type { WorldlineFork } from "@/lib/worlds/storage";

export type TimelineSelection = { worldlineId?: string; eventId?: string };
export const forkKey = (worldId: string) => `if:worldline-forks:${worldId}`;

export function loadBrowserForks(worldId: string): WorldlineFork[] {
  // Surface storage failures to callers: a failed read is not an empty archive.
  const stored: unknown = JSON.parse(localStorage.getItem(forkKey(worldId)) ?? "[]");
  if (!Array.isArray(stored)) return [];
  return stored.filter((item): item is WorldlineFork => (
    item !== null && typeof item === "object" &&
    typeof item.id === "string" && item.worldId === worldId &&
    typeof item.fromEventId === "string" && typeof item.name === "string" &&
    typeof item.premise === "string" && typeof item.createdAt === "string" &&
    timeline.some(event => event.id === item.fromEventId)
  ));
}

export function worldlineOptions(forks: WorldlineFork[], demo: boolean) {
  return [...(demo ? branches.filter(branch => branch.id !== "silent-orbit") : [branches[0]]), ...forks];
}

export function eventsForWorldline(events: typeof timeline, worldlineId: string, forks: WorldlineFork[], demo: boolean) {
  const main = demo ? events.filter(event => event.id !== "e5") : events;
  const federation = demo ? events.filter(event => ["e1", "e2", "e5"].includes(event.id)) : [];
  if (worldlineId === "main") return main;
  if (demo && worldlineId === "federation") return federation;
  const fork = forks.find(item => item.id === worldlineId);
  if (!fork) return [];
  const inherited = demo && fork.fromEventId === "e5" ? federation : main;
  const originIndex = inherited.findIndex(event => event.id === fork.fromEventId);
  return inherited.slice(0, originIndex + 1);
}
