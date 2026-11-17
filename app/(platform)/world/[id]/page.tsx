import { notFound } from "next/navigation";
import { WorldMap } from "@/components/world/WorldMap";
import { PrivateWorld } from "@/components/world/PrivateWorld";
import { worldById } from "@/lib/data";

export default async function WorldPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ worldline?: string; event?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const initialSelection = { worldlineId: typeof query.worldline === "string" ? query.worldline : undefined, eventId: typeof query.event === "string" ? query.event : undefined };
  const world = worldById(id);
  if (world) return <WorldMap key={`${id}:${query.worldline}:${query.event}`} world={world} initialSelection={initialSelection} />;
  if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return <PrivateWorld key={`${id}:${query.worldline}:${query.event}`} id={id} initialSelection={initialSelection} />;
  notFound();
}
