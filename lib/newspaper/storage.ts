import type { SupabaseClient } from "@supabase/supabase-js";
import { newspaperKey, normalizeDraft, sampleFor, type NewspaperArticle, type NewspaperDraft, type NewspaperRef } from "./model";

type ArticleRow = {
  id: string; world_id: string; fork_id: string | null; year_id: string | null;
  author_id: string; newspaper_name: string; published_on: string; headline: string;
  body: string; created_at: string; updated_at: string;
};

const columns = "id,world_id,fork_id,year_id,author_id,newspaper_name,published_on,headline,body,created_at,updated_at";
const browserKey = (ref: NewspaperRef) => `if:newspaper:v1:${newspaperKey(ref)}`;
const authorKey = "if:newspaper-author:v1";

export function browserAuthorId(): string | null {
  return localStorage.getItem(authorKey);
}

export function loadBrowserNewspaper(ref: NewspaperRef): NewspaperArticle | null {
  const seed = sampleFor(ref);
  if (seed) return seed;
  const raw = localStorage.getItem(browserKey(ref));
  if (!raw) return null;
  const article: NewspaperArticle = JSON.parse(raw);
  if (!article || newspaperKey(article) !== newspaperKey(ref) ||
      typeof article.id !== "string" || typeof article.authorId !== "string" ||
      typeof article.createdAt !== "string" || typeof article.updatedAt !== "string") {
    throw new Error("This browser’s article could not be read.");
  }
  normalizeDraft(article);
  return article;
}

export function saveBrowserNewspaper(ref: NewspaperRef, draft: NewspaperDraft, existing: NewspaperArticle | null) {
  if (sampleFor(ref)) throw new Error("The sample article is read-only.");
  const current = loadBrowserNewspaper(ref);
  let authorId = browserAuthorId();
  if (existing && (!authorId || existing.authorId !== authorId || current?.id !== existing.id ||
      current.updatedAt !== existing.updatedAt)) throw new Error("This article changed or belongs to another author. Reopen it before editing.");
  if (!existing && current) throw new Error("An article already exists for this event. Reopen it before editing.");
  if (!authorId) {
    authorId = crypto.randomUUID();
    localStorage.setItem(authorKey, authorId);
  }
  const now = new Date().toISOString();
  const article: NewspaperArticle = {
    ...ref, ...normalizeDraft(draft), id: existing?.id ?? crypto.randomUUID(), authorId,
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  };
  // Only return success after durable browser storage succeeds.
  localStorage.setItem(browserKey(ref), JSON.stringify(article));
  return article;
}

function fromRow(row: ArticleRow): NewspaperArticle {
  return {
    id: row.id, worldId: row.world_id, worldlineId: row.fork_id ?? "main", eventId: row.year_id ?? "origin",
    authorId: row.author_id, newspaperName: row.newspaper_name, publishedOn: row.published_on,
    headline: row.headline, body: row.body, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function relation(ref: NewspaperRef) {
  return { world_id: ref.worldId, fork_id: ref.worldlineId === "main" ? null : ref.worldlineId, year_id: ref.eventId === "origin" ? null : ref.eventId };
}

export async function loadAccountNewspaper(client: SupabaseClient, ref: NewspaperRef, signal: AbortSignal) {
  const { world_id, fork_id, year_id } = relation(ref);
  let query = client.from("if_newspaper_articles").select(columns).eq("world_id", world_id);
  query = fork_id ? query.eq("fork_id", fork_id) : query.is("fork_id", null);
  query = year_id ? query.eq("year_id", year_id) : query.is("year_id", null);
  const { data, error } = await query.abortSignal(signal).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ArticleRow) : null;
}

export async function saveAccountNewspaper(client: SupabaseClient, ref: NewspaperRef, draft: NewspaperDraft, existing: NewspaperArticle | null) {
  if (existing && newspaperKey(existing) !== newspaperKey(ref)) throw new Error("The article belongs to another event.");
  const normalized = normalizeDraft(draft);
  const fields = { newspaper_name: normalized.newspaperName, published_on: normalized.publishedOn, headline: normalized.headline, body: normalized.body };
  const table = client.from("if_newspaper_articles");
  // Updates cannot change the author or relationship. RLS is the authority.
  const query = existing
    ? table.update(fields).eq("id", existing.id).eq("world_id", ref.worldId).eq("updated_at", existing.updatedAt)
    : table.insert({ ...relation(ref), ...fields });
  const { data, error } = await query.select(columns).single();
  if (error) throw error;
  return fromRow(data as ArticleRow);
}
