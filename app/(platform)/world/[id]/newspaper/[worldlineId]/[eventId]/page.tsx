import { notFound } from "next/navigation";
import { NewspaperWorkspace } from "@/components/newspaper/NewspaperWorkspace";
import { worldById } from "@/lib/data";
import "@/components/newspaper/newspaper.css";

export default async function NewspaperPage({ params, searchParams }: {
  params: Promise<{ id: string; worldlineId: string; eventId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id: worldId, worldlineId, eventId } = await params;
  const { edit } = await searchParams;
  if (!worldById(worldId) && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(worldId)) notFound();
  return <NewspaperWorkspace reference={{ worldId, worldlineId, eventId }} edit={edit === "1"} />;
}
