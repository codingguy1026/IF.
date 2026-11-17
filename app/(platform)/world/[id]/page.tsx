import { notFound } from "next/navigation";
import { WorldMap } from "@/components/world/WorldMap";
import { PrivateWorld } from "@/components/world/PrivateWorld";
import { worldById } from "@/lib/data";

export default async function WorldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const world = worldById(id);
  if (world) return <WorldMap world={world} />;
  if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return <PrivateWorld id={id} />;
  notFound();
}
