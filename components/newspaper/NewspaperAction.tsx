"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { newspaperPath, type NewspaperRef, type NewspaperScope } from "@/lib/newspaper/model";
import { useNewspaper } from "./useNewspaper";

export function NewspaperAction({ reference, scope, canCreate = false }: { reference: NewspaperRef; scope: NewspaperScope; canCreate?: boolean }) {
  const { article, loading, error, retry } = useNewspaper(reference, scope);
  if (loading) return <span className="newspaper-action-status" role="status">Loading newspaper…</span>;
  if (error) return <button className="newspaper-action" onClick={retry}>Retry newspaper</button>;
  if (!article && !canCreate) return null;
  return <Link className="newspaper-action" href={`${newspaperPath(reference)}${article ? "" : "?edit=1"}`}>
    <Newspaper aria-hidden="true" /> {article ? "Read newspaper" : "Add article"}
  </Link>;
}
