import type { SupabaseClient } from "@supabase/supabase-js";
import type { World, timeline } from "@/lib/data";

export type SavedWorld = {
  id: string;
  name: string;
  description: string;
  start: string;
  rules: string;
  policy: World["policy"];
  created_at: string;
};

export type SavedYear = {
  id: string;
  year: string;
};

export type WorldlineFork = {
  id: string;
  worldId: string;
  fromEventId: string;
  name: string;
  premise: string;
  createdAt: string;
};

type ForkRow = {
  id: string;
  world_id: string;
  from_year_id: string | null;
  name: string;
  premise: string;
  created_at: string;
};

type WorkspaceRow = SavedWorld & {
  if_world_years: SavedYear[];
  if_world_forks: ForkRow[];
};

const worldColumns = "id,name,description,start,rules,policy,created_at";
const forkColumns = "id,world_id,from_year_id,name,premise,created_at";
export const originEventId = "origin";

export function worldEvents(world: SavedWorld, years: SavedYear[]): typeof timeline {
  return [
    { id: originEventId, year: world.start, title: "Point of origin", text: world.description, x: 110, y: 90, important: true, articleIds: [] },
    ...years.map((entry, index) => ({
      id: entry.id, year: entry.year, title: "Timeline point", text: `A point in the main worldline of ${world.name}.`,
      x: 310 + index * 200, y: 90, important: false, articleIds: [],
    })),
  ];
}

function mapFork(row: ForkRow): WorldlineFork {
  return {
    id: row.id,
    worldId: row.world_id,
    fromEventId: row.from_year_id ?? originEventId,
    name: row.name,
    premise: row.premise,
    createdAt: row.created_at,
  };
}

export async function createWorld(
  client: SupabaseClient,
  world: Omit<SavedWorld, "created_at">,
) {
  const { error } = await client.from("if_worlds").insert(world);
  if (!error) return;
  if (error.code === "23505") {
    const existing = await client.from("if_worlds").select("id").eq("id", world.id).maybeSingle();
    if (!existing.error && existing.data) return;
  }
  throw error;
}

export async function listWorlds(client: SupabaseClient, signal: AbortSignal) {
  const { data, error } = await client.from("if_worlds").select(worldColumns)
    .order("created_at", { ascending: false }).abortSignal(signal);
  if (error) throw error;
  return data as SavedWorld[];
}

export async function loadWorld(client: SupabaseClient, id: string, signal: AbortSignal) {
  const { data, error } = await client.from("if_worlds")
    .select(`${worldColumns},if_world_years(id,year),if_world_forks(${forkColumns})`)
    .eq("id", id)
    .order("created_at", { referencedTable: "if_world_years" })
    .order("id", { referencedTable: "if_world_years" })
    .order("created_at", { referencedTable: "if_world_forks" })
    .order("id", { referencedTable: "if_world_forks" })
    .abortSignal(signal).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { if_world_years: years, if_world_forks: forks, ...world } = data as WorkspaceRow;
  return { world, years, forks: forks.map(mapFork) };
}

export async function saveYear(client: SupabaseClient, worldId: string, year: string) {
  const { data, error } = await client.from("if_world_years")
    .upsert({ world_id: worldId, year }, { onConflict: "world_id,year", ignoreDuplicates: true })
    .select("id,year").maybeSingle();
  if (error) throw error;
  if (data) return data as SavedYear;

  const existing = await client.from("if_world_years").select("id,year")
    .eq("world_id", worldId).eq("year", year).single();
  if (existing.error) throw existing.error;
  return existing.data as SavedYear;
}

export async function saveWorldFork(client: SupabaseClient, fork: WorldlineFork) {
  const { data, error } = await client.from("if_world_forks").insert({
    id: fork.id,
    world_id: fork.worldId,
    from_year_id: fork.fromEventId === originEventId ? null : fork.fromEventId,
    name: fork.name,
    premise: fork.premise,
  }).select(forkColumns).single();
  if (!error) return mapFork(data);
  if (error.code === "23505") {
    const existing = await client.from("if_world_forks").select(forkColumns).eq("id", fork.id).maybeSingle();
    if (!existing.error && existing.data) return mapFork(existing.data);
  }
  throw error;
}
