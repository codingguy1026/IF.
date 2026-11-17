# IF.

A collaborative archive for imagined histories. Create worlds, document lore, and branch any event into an alternate worldline.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## IF. Account setup (separate from Drawing ID)

**Use a new Supabase project dedicated to IF.** Supabase Auth users are scoped to a project. Do not reuse the Drawing ID project's URL or credentials, or the accounts may overlap.

1. Create a new IF. project in Supabase.
2. Copy **Project URL** and **publishable key** from Project Settings / API into `.env.local` using `.env.example` as a template.
3. In Supabase **Authentication → URL Configuration**, set **Site URL** to your IF. site origin, such as `http://localhost:3000`.
4. Add allowed redirect URLs for:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=**`
   - `http://localhost:3000/auth/reset-password`
   - Add your production IF. URLs using the same routes.
5. Under **Authentication → Providers → Email**, enable email sign-ups. Keeping email confirmation enabled is recommended.
6. To turn on **Google login**, configure Google OAuth in Google Cloud, then enable Google under **Authentication → Providers → Google**. Set Google's authorized redirect URI to Supabase's own callback URI: `https://YOUR-IF-PROJECT.supabase.co/auth/v1/callback`.

Restart the Next.js development server after changing environment variables. **Never put a service_role key or secret key in `NEXT_PUBLIC_` variables.** Only a publishable key belongs in the browser.

### Included in v0.1

- `/auth/login`: email/password login, sign-up, Google OAuth, password-reset email
- `/auth/callback`: OAuth and email-confirmation return
- `/auth/reset-password`: set a new password after using the emailed link
- `/profile`: signed-in account info, edit display name and sign out
- `/create`: client-side sign-in gate
- Account status links in navigation and the world view

## Private worlds and worldlines

Apply the migration in `supabase/migrations/` to the dedicated IF. Supabase project before using the world editor. It creates owner-only tables for worlds, timeline points, and forks. Access is enforced by Row Level Security.

After signing in, use **Create a world** to start a private world. Open it again from **Account → My worlds**. Add timeline points with **+** and select a point to use **Fork from here**. The world, timeline points, and forks follow your account across devices. Contribution preferences are saved for future sharing.

The public sample archive and its existing browser-local forks are still available for exploration. The earlier create form saved a small last-world draft in the browser, with its name, starting date, and contribution preference.

## Worldline Newspaper

Select an event in the timeline and use **Read newspaper**. The Luna Republic's **2034 · Moon declares independence** event includes a read-only *Artemis Ledger* sample edition. Its wiki records also link to the same newspaper from **Related events**.

To write, open an event in your private account world, or create a browser-local fork of a public sample with **Fork from here**. Choose the worldline at the top of the timeline, select an inherited event, and use **Add article**. Enter a newspaper name, publication date, headline, and plain-text body. Fictional calendars are supported. Save, reopen, and use **Edit article** to revise your edition. The close button and the source link return to the same worldline and event. The worldline selector keeps its selection on refresh.

### Actual storage and permissions

| Worldline | Where articles are saved | Who can edit |
| --- | --- | --- |
| Private account world / its forks | Dedicated IF. Supabase project, `if_newspaper_articles`; follows the signed-in account across browsers/devices | The article's author, while they own the world; enforced with RLS and column grants |
| User-created fork of a public sample | `localStorage` in this browser profile, origin, and device; no account synchronization; cleared with site data | The browser profile that created the article |
| Built-in public sample worldlines | Bundled read-only sample content | Read only; fork an event to write a separate edition |

The editor displays its storage scope before saving. Account failures never fall back to browser storage. Browser saves only report success after `localStorage` succeeds; failed saves leave the form intact. New articles are independent per worldline, including events inherited from the same origin. Renaming a worldline, date, or headline does not change article identity.

**Database setup:** apply `20261117140000_worldline_newspaper.sql` after `20261117042102_private_worldlines.sql` in the dedicated IF. Supabase project. It requires PostgreSQL 15+ (`UNIQUE NULLS NOT DISTINCT`). This adds a table, RLS policies, immutable relationship/author columns, a server-managed edit timestamp, and foreign keys scoped to the world. The migration must be applied before account newspaper operations work. No service-role key is used.

The application addresses editions by `{ worldId, worldlineId, eventId }`. In account storage, the main worldline maps to `fork_id = NULL` and the stable `origin` event maps to `year_id = NULL`. Fork/year UUIDs reference the existing world tables with composite foreign keys. A unique constraint includes the null sentinels, enforcing one edition per worldline/event even for the origin. Public sample IDs and local fork UUIDs use a separate browser namespace and never enter the account table. Sample forks inherit events through their fork point; they do not inherit newspaper articles.

### Verify the first version

1. Open `/world/luna-republic`, read the selected 2034 sample newspaper, and return using the source-event link.
2. Fork that event, choose **Add article**, fill all four fields, and save. Refresh, reopen from the event, edit, and save again.
3. Switch between the new fork and **Main worldline** on the same event. The fork's edition and the read-only sample must stay separate. Create a second fork to check an empty edition.
4. Open `/world/luna-republic/wiki/lunar-republic` and use **Read newspaper** under **Related events**. Switch to the Federation wiki record to confirm the Main edition is absent.
5. After configuring Supabase and applying both migrations, sign in, create a private world, and repeat create/save/refresh/edit on the origin and a timeline point. Check a fork of that event. A different account must not see the private world or its articles.
6. Check the reader/editor and return/close links at desktop and 320/390 px widths. Body line breaks should survive saving; mobile reading should use one column without horizontal overflow.

`npm test` covers persistence, worldline/world isolation, author checks, storage failures, input validation, account query mapping, and actual PostgreSQL migration/RLS behavior in an in-memory PGlite database. It uses synthetic accounts and does not modify a hosted Supabase project. Run `npm run build` for the production check.

## Status

IF. is a prototype. Shared worlds and cloud-backed wiki editing are still in development.
