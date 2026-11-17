"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Pencil, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import type { timeline } from "@/lib/data";
import { eventPath, newspaperLimits, newspaperPath, type NewspaperArticle, type NewspaperDraft, type NewspaperRef, type NewspaperScope } from "@/lib/newspaper/model";
import { useNewspaper } from "./useNewspaper";

type Context = { worldName: string; worldlineName: string; event: typeof timeline[number]; scope: NewspaperScope; canCreate: boolean };

export function NewspaperView({ reference, context, edit }: { reference: NewspaperRef; context: Context; edit: boolean }) {
  const { article, loading, error, retry, canEdit, save } = useNewspaper(reference, context.scope);
  const router = useRouter();
  const back = eventPath(reference);
  const path = newspaperPath(reference);
  const showEditor = (!article && context.canCreate) || (edit && canEdit);

  return <main className="newspaper-frame">
    <nav className="newspaper-navigation" aria-label="Newspaper navigation">
      <Link href={back}><ArrowLeft aria-hidden="true" /> Timeline</Link>
      <span>IF. / WORLDLINE NEWSPAPER</span>
      <Link href={back} aria-label="Close newspaper and return to event"><X aria-hidden="true" /></Link>
    </nav>
    {loading ? <div className="newspaper-state" role="status">Loading article…</div>
      : error ? <div className="newspaper-state"><h1>Couldn’t load this article.</h1><p>Your article has not been changed.</p><button onClick={retry}>Try again</button></div>
      : showEditor ? <NewspaperEditor
        key={article?.id ?? "new"} article={article} context={context}
        cancelHref={article ? path : back}
        onSave={async draft => { await save(draft); router.replace(path, { scroll: true }); }}
      />
      : article ? <>
        <div className="newspaper-reading-tools">
          <span>{article.authorId === null ? "SAMPLE EDITION · READ ONLY" : context.scope === "browser" ? "SAVED IN THIS BROWSER" : "PRIVATE ACCOUNT EDITION"}</span>
          {canEdit && <Link href={`${path}?edit=1`}><Pencil aria-hidden="true" /> Edit article</Link>}
        </div>
        <article className="newspaper-paper" aria-labelledby="newspaper-headline">
          <div className="newspaper-worldline"><span>Fictional worldline</span><strong>{context.worldlineName}</strong></div>
          <header className="newspaper-masthead">
            <p className="newspaper-name">{article.newspaperName}</p>
            <div className="newspaper-dateline"><span>{context.worldName}</span><span>{article.publishedOn}</span></div>
          </header>
          <div className="newspaper-story">
            <p className="newspaper-section">FROM THE WORLDLINE / {context.event.year}</p>
            <h1 id="newspaper-headline">{article.headline}</h1>
            <div className="newspaper-body">{article.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          </div>
          <footer className="newspaper-source">
            <span>THE EVENT BEHIND THIS EDITION</span>
            <Link href={back}>{context.event.year} · {context.event.title}<ArrowUpRight aria-hidden="true" /></Link>
          </footer>
        </article>
        <p className="newspaper-fiction-note">A fictional report from an imagined history.</p>
      </>
      : <div className="newspaper-state"><h1>No article for this event yet.</h1><p>This worldline has no published newspaper article for the selected event.</p><Link href={back}>Back to event</Link></div>}
  </main>;
}

function NewspaperEditor({ article, context, onSave, cancelHref }: {
  article: NewspaperArticle | null; context: Context; onSave: (draft: NewspaperDraft) => Promise<void>; cancelHref: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    const draft: NewspaperDraft = {
      newspaperName: String(form.get("newspaperName") ?? ""), publishedOn: String(form.get("publishedOn") ?? ""),
      headline: String(form.get("headline") ?? ""), body: String(form.get("body") ?? ""),
    };
    saving.current = true;
    setBusy(true);
    setError("");
    try { await onSave(draft); }
    catch {
      setError("Couldn’t save this article. Your draft is still here. Check your connection and storage, or reopen the article if it was edited elsewhere.");
    } finally { saving.current = false; setBusy(false); }
  }

  return <section className="newspaper-editor" aria-labelledby="newspaper-editor-title">
    <span className="newspaper-editor-kicker">WRITE FROM INSIDE THE WORLD</span>
    <h1 id="newspaper-editor-title">{article ? "Edit this edition." : "A first draft of history."}</h1>
    <dl className="newspaper-context">
      <div><dt>World</dt><dd>{context.worldName}</dd></div>
      <div><dt>Worldline</dt><dd>{context.worldlineName}</dd></div>
      <div><dt>Linked event</dt><dd>{context.event.year} · {context.event.title}</dd></div>
    </dl>
    <p className="newspaper-storage-note" role="note">{context.scope === "browser"
      ? "Saved only in this browser on this device. Articles are not synced to your IF. account; clearing site data removes them. This browser profile is the author."
      : "Saved privately to your IF. account, like this worldline. Only the author can edit this article."} One article per event in each worldline.</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <div className="newspaper-form-row">
          <label>Newspaper name<input name="newspaperName" maxLength={newspaperLimits.newspaperName} defaultValue={article?.newspaperName ?? ""} placeholder="e.g. Artemis Ledger" autoFocus required /></label>
          <label>Publication date<input name="publishedOn" maxLength={newspaperLimits.publishedOn} defaultValue={article?.publishedOn ?? context.event.year} aria-describedby="newspaper-date-help" required /></label>
        </div>
        <p id="newspaper-date-help" className="newspaper-field-help">Use your world’s calendar, e.g. 14 July 2034 or Year 12, First Dawn.</p>
        <label>Headline<input name="headline" maxLength={newspaperLimits.headline} defaultValue={article?.headline ?? ""} placeholder="What happened, in their words?" required /></label>
        <label>Body<textarea name="body" maxLength={newspaperLimits.body} defaultValue={article?.body ?? ""} rows={12} placeholder="Report the event as a journalist living through it…" aria-describedby="newspaper-body-help" required /></label>
        <p id="newspaper-body-help" className="newspaper-field-help">Plain text · up to 20,000 characters. Line breaks are preserved.</p>
      </fieldset>
      {error && <p className="newspaper-save-error" role="alert">{error}</p>}
      <div className="newspaper-form-actions"><Link href={cancelHref}>Cancel</Link><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save article"}<ArrowUpRight aria-hidden="true" /></button></div>
    </form>
  </section>;
}
