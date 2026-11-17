import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { eventPath, newspaperKey, normalizeDraft, sampleFor, sampleNewspaper, type NewspaperRef } from "../lib/newspaper/model";
import { browserAuthorId, loadAccountNewspaper, loadBrowserNewspaper, saveAccountNewspaper, saveBrowserNewspaper } from "../lib/newspaper/storage";
import { eventsForWorldline } from "../lib/newspaper/worldlines";
import { timeline } from "../lib/data";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  clear() { this.data.clear(); }
}
const storage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
beforeEach(() => storage.clear());

const ref: NewspaperRef = { worldId: "luna-republic", worldlineId: "fork-1", eventId: "e3" };
const draft = { newspaperName: "A newspaper", publishedOn: "Year 9, First Dawn", headline: "An event", body: "First paragraph.\nA second line.\n\nAnother paragraph." };

test("browser articles persist, edit in place, and preserve line breaks", () => {
  const saved = saveBrowserNewspaper(ref, draft, null);
  assert.deepEqual(loadBrowserNewspaper(ref), saved);
  assert.equal(saved.authorId, browserAuthorId());
  const updated = saveBrowserNewspaper(ref, { ...draft, headline: "Updated report" }, loadBrowserNewspaper(ref));
  assert.equal(updated.id, saved.id);
  assert.equal(updated.createdAt, saved.createdAt);
  assert.equal(loadBrowserNewspaper(ref)?.headline, "Updated report");
  assert.equal(loadBrowserNewspaper(ref)?.body, draft.body);
});

test("the same event has separate articles in every world and worldline", () => {
  saveBrowserNewspaper(ref, draft, null);
  const otherLine = { ...ref, worldlineId: "fork-2" };
  const otherWorld = { ...ref, worldId: "another-world" };
  assert.equal(loadBrowserNewspaper(otherLine), null);
  assert.equal(loadBrowserNewspaper(otherWorld), null);
  saveBrowserNewspaper(otherLine, { ...draft, headline: "Another outcome" }, null);
  assert.equal(loadBrowserNewspaper(ref)?.headline, draft.headline);
  assert.equal(loadBrowserNewspaper(otherLine)?.headline, "Another outcome");
  assert.notEqual(newspaperKey(ref), newspaperKey(otherLine));
});

test("the Luna sample is scoped exactly, read only, and not inherited", () => {
  assert.equal(sampleFor({ worldId: "luna-republic", worldlineId: "main", eventId: "e3" }), sampleNewspaper);
  assert.equal(sampleFor(ref), null);
  assert.equal(sampleFor({ ...sampleNewspaper, worldId: "earth-17" }), null);
  assert.throws(() => saveBrowserNewspaper(sampleNewspaper, draft, sampleNewspaper), /read-only/);
});

test("the bundled sample remains readable when browser storage is blocked", () => {
  const original = storage.getItem;
  storage.getItem = () => { throw new Error("Storage blocked"); };
  try { assert.equal(loadBrowserNewspaper(sampleNewspaper), sampleNewspaper); }
  finally { storage.getItem = original; }
});

test("duplicate creation and edits by a different browser author are rejected", () => {
  const saved = saveBrowserNewspaper(ref, draft, null);
  assert.throws(() => saveBrowserNewspaper(ref, draft, null), /already exists/);
  storage.setItem("if:newspaper-author:v1", "someone-else");
  assert.throws(() => saveBrowserNewspaper(ref, draft, saved), /another author/);
});

test("stale edits, corrupt storage, and storage quota failures never report a successful save", () => {
  const saved = saveBrowserNewspaper(ref, draft, null);
  const stale = { ...saved, updatedAt: "2000-01-01T00:00:00Z" };
  assert.throws(() => saveBrowserNewspaper(ref, draft, stale), /changed/);
  storage.setItem(`if:newspaper:v1:${newspaperKey(ref)}`, "broken json");
  assert.throws(() => loadBrowserNewspaper(ref));
  storage.clear();
  const original = storage.setItem;
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  try { assert.throws(() => saveBrowserNewspaper(ref, draft, null), /Quota exceeded/); }
  finally { storage.setItem = original; }
});

test("validation accepts fictional dates and rejects blank or overlong text", () => {
  assert.equal(normalizeDraft(draft).publishedOn, "Year 9, First Dawn");
  assert.throws(() => normalizeDraft({ ...draft, headline: "   " }));
  assert.throws(() => normalizeDraft({ ...draft, body: "a".repeat(20001) }));
});

test("worldline event membership and return links keep the selected context", () => {
  const forks = [{ id: "fork-1", worldId: ref.worldId, fromEventId: "e3", name: "A renamed worldline", premise: "Different history", createdAt: "2034" }];
  assert.deepEqual(eventsForWorldline(timeline, "main", forks, true).map(event => event.id), ["e1", "e2", "e3", "e4"]);
  assert.deepEqual(eventsForWorldline(timeline, "federation", forks, true).map(event => event.id), ["e1", "e2", "e5"]);
  assert.deepEqual(eventsForWorldline(timeline, "fork-1", forks, true).map(event => event.id), ["e1", "e2", "e3"]);
  assert.deepEqual(eventsForWorldline(timeline, "missing", forks, true), []);
  assert.equal(eventPath(ref), "/world/luna-republic?worldline=fork-1&event=e3#event-details");
});

test("account reads use both nullable identities and edits keep relationships immutable", async () => {
  const calls: { url: string; method: string; body: Record<string, string> | null }[] = [];
  const row = { id: "article-1", world_id: "world-1", fork_id: null, year_id: null, author_id: "owner-1", newspaper_name: draft.newspaperName, published_on: draft.publishedOn, headline: draft.headline, body: draft.body, created_at: "2034-01-01", updated_at: "2034-01-02" };
  const client = createClient("https://example.supabase.co", "public-test-key", {
    auth: { persistSession: false },
    global: { fetch: async (input, init) => {
      calls.push({ url: String(input), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify(row), { status: 200, headers: { "Content-Type": "application/json" } });
    } },
  });
  const selected = { worldId: "world-1", worldlineId: "main", eventId: "origin" };
  const loaded = await loadAccountNewspaper(client, selected, new AbortController().signal);
  assert.equal(loaded?.worldlineId, "main");
  assert.equal(loaded?.eventId, "origin");
  const params = new URL(calls[0].url).searchParams;
  assert.equal(params.get("world_id"), "eq.world-1");
  assert.equal(params.get("fork_id"), "is.null");
  assert.equal(params.get("year_id"), "is.null");
  await saveAccountNewspaper(client, selected, draft, loaded);
  assert.equal(calls[1].method, "PATCH");
  assert.deepEqual(Object.keys(calls[1].body!).sort(), ["body", "headline", "newspaper_name", "published_on"]);
  assert.equal(new URL(calls[1].url).searchParams.get("updated_at"), "eq.2034-01-02");
  await loadAccountNewspaper(client, { ...selected, worldlineId: "fork-uuid", eventId: "year-uuid" }, new AbortController().signal);
  const branchParams = new URL(calls[2].url).searchParams;
  assert.equal(branchParams.get("fork_id"), "eq.fork-uuid");
  assert.equal(branchParams.get("year_id"), "eq.year-uuid");
});
