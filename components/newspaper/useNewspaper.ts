"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { newspaperKey, sampleFor, type NewspaperArticle, type NewspaperDraft, type NewspaperRef, type NewspaperScope } from "@/lib/newspaper/model";
import { browserAuthorId, loadAccountNewspaper, loadBrowserNewspaper, saveAccountNewspaper, saveBrowserNewspaper } from "@/lib/newspaper/storage";

type Result = { key: string; article: NewspaperArticle | null; authorId: string | null; error: boolean };

export function useNewspaper(ref: NewspaperRef, scope: NewspaperScope) {
  const { client, user } = useAuth();
  const userId = user?.id;
  const key = `${scope}:${scope === "account" ? userId ?? "" : "browser"}:${newspaperKey(ref)}`;
  const [result, setResult] = useState<Result>();
  const [attempt, setAttempt] = useState(0);
  const { worldId, worldlineId, eventId } = ref;

  useEffect(() => {
    const request = new AbortController();
    const selected = { worldId, worldlineId, eventId };
    if (scope === "account" && (!client || !userId)) return;
    void (async () => {
      try {
        const article = scope === "account"
          ? await loadAccountNewspaper(client!, selected, request.signal)
          : loadBrowserNewspaper(selected);
        const authorId = scope === "account" ? userId! : article?.authorId === null ? null : browserAuthorId();
        if (!request.signal.aborted) setResult({ key, article, authorId, error: false });
      } catch {
        if (!request.signal.aborted) setResult({ key, article: null, authorId: null, error: true });
      }
    })();
    const onStorage = () => setAttempt(value => value + 1);
    if (scope === "browser") window.addEventListener("storage", onStorage);
    return () => { request.abort(); window.removeEventListener("storage", onStorage); };
  }, [scope, client, userId, key, worldId, worldlineId, eventId, attempt]);

  // Never render a previous event's or previous user's result, even for one frame.
  const current = result?.key === key ? result : undefined;
  const seed = scope === "browser" ? sampleFor(ref) : null;
  const article = current?.article ?? seed;
  return {
    article,
    loading: !current && !seed,
    error: current?.error ?? false,
    canEdit: Boolean(article?.authorId && article.authorId === current?.authorId),
    retry: () => { setResult(undefined); setAttempt(value => value + 1); },
    save: async (draft: NewspaperDraft) => {
      if (!current || current.error) throw new Error("Reopen the article before saving.");
      const saved = scope === "account"
        ? await saveAccountNewspaper(client!, ref, draft, current.article)
        : saveBrowserNewspaper(ref, draft, current.article);
      setResult({ key, article: saved, authorId: scope === "account" ? userId! : browserAuthorId(), error: false });
      return saved;
    },
  };
}
