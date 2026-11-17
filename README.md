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

## Status

IF. is a prototype. Shared worlds and cloud-backed wiki editing are still in development.
