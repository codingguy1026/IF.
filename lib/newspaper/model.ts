export type NewspaperRef = {
  worldId: string;
  worldlineId: string;
  eventId: string;
};

export type NewspaperDraft = {
  newspaperName: string;
  publishedOn: string;
  headline: string;
  body: string;
};

export type NewspaperArticle = NewspaperRef & NewspaperDraft & {
  id: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewspaperScope = "account" | "browser";

export const newspaperLimits = { newspaperName: 100, publishedOn: 80, headline: 240, body: 20000 } as const;

// Use stable IDs, never worldline names, event titles, or dates, as identity.
export function newspaperKey(ref: NewspaperRef) {
  return JSON.stringify([ref.worldId, ref.worldlineId, ref.eventId]);
}

export function newspaperPath(ref: NewspaperRef) {
  return `/world/${encodeURIComponent(ref.worldId)}/newspaper/${encodeURIComponent(ref.worldlineId)}/${encodeURIComponent(ref.eventId)}`;
}

export function eventPath(ref: NewspaperRef) {
  const query = new URLSearchParams({ worldline: ref.worldlineId, event: ref.eventId });
  return `/world/${encodeURIComponent(ref.worldId)}?${query}#event-details`;
}

export function normalizeDraft(draft: NewspaperDraft): NewspaperDraft {
  const normalized = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()]));
  for (const [field, limit] of Object.entries(newspaperLimits)) {
    const value = normalized[field];
    if (typeof value !== "string" || !value || value.length > limit) {
      throw new Error("Complete every field within the displayed limits.");
    }
  }
  return normalized as NewspaperDraft;
}

export const sampleNewspaper: NewspaperArticle = {
  id: "artemis-ledger-independence-2034",
  worldId: "luna-republic",
  worldlineId: "main",
  eventId: "e3",
  authorId: null,
  newspaperName: "Artemis Ledger",
  publishedOn: "14 July 2034",
  headline: "Lunar Assembly Declares Independence",
  body: "ARTEMIS — The Lunar Assembly declared independence today, as representatives of the lunar settlements signed the Lunar Declaration inside the Assembly chamber.\n\nOutside, citizens crowded the pressurized galleries facing the Assembly. Cheers rose when the vote appeared on public screens; families waved handmade lunar flags while workers paused to listen to the announcement.\n\n“We built a home here. Today we get to help decide its future,” said one resident in the crowd. Others welcomed the vote more cautiously, asking what Earth’s response would mean for supply ships and relatives across the sky.\n\nAs the gathering continued, the Assembly called for calm and promised a further statement on the transition. For the citizens waiting outside its doors, the future suddenly felt closer — and less certain.",
  createdAt: "2034-07-14T12:00:00Z",
  updatedAt: "2034-07-14T12:00:00Z",
};

export function sampleFor(ref: NewspaperRef) {
  return newspaperKey(ref) === newspaperKey(sampleNewspaper) ? sampleNewspaper : null;
}
