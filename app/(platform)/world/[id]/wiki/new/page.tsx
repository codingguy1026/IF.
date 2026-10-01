import { notFound } from "next/navigation";
import { NewArticleForm } from "@/components/wiki/NewArticleForm";
import { worldById } from "@/lib/data";

export default async function NewWikiArticlePage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if (!worldById(id)) notFound();
  return <NewArticleForm worldId={id}/>;
}
