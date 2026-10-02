import { notFound } from "next/navigation";
import { WorldMap } from "@/components/world/WorldMap";
import { worlds } from "@/lib/data";

export default async function WorldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const world = worlds.find((item) => item.id === id);
  if (!world) notFound();

  return <WorldMap world={world} />;
}
