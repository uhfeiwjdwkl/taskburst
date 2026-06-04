# Plan

A large request — grouping into focused units. I'll confirm scope before building.

## 1. Auth UX (KommenszlapfAccountDialog + Navigation)
- Move the account button into the mobile dropdown nav (kept inline on desktop).
- **Sign in form**
  - Single "Email or username" field + password.
  - Sign-in resolves username → email via a public lookup edge function (cannot query auth.users from client).
  - Persistent session (Supabase default JWT + refresh = up to ~1 year; explicit `persistSession: true`).
  - "Show password" eye toggle on every password field.
  - "Forgot password" link → sends `resetPasswordForEmail` with `redirectTo` of new `/reset-password` page.
  - Warning banner: "Signing in will replace all current local data with your account data."
- **Sign up form**
  - Username + email + password + confirm password.
  - Inline notice: "Check your email to confirm your account before signing in."
  - Toast on submit reiterating it.

## 2. Email confirmation landing page
- New route `/auth/confirmed` with a simple "Email confirmed" card and a "Return to TaskBurst" button → `/`.
- Update Supabase signup `emailRedirectTo` and reset-password `redirectTo` to point at TaskBurst routes (`/auth/confirmed`, `/reset-password`).
- Note: the URL the email actually sends to is also controlled by the Supabase "Site URL" / redirect allow-list in the dashboard. I'll update redirect params in code; the user will need to add these URLs to the Supabase auth redirect allow-list (I'll surface the link).

## 3. Reset password page
- New `/reset-password` route. Reads recovery session, lets user set new password, redirects to `/` on success.

## 4. Settings additions
- **Account section** (when signed in):
  - Export account data (downloads JSON of every `kommenszlapf_user_data` row + profile).
  - Change username (requires password twice).
  - Change email (requires password twice, triggers Supabase email change confirmation).
  - Delete account (requires password twice) → edge function deletes auth user + rows.
- **Data section**:
  - "Delete all data" button — if a PIN or account password exists, requires double entry of that credential; otherwise a plain confirm.

## 5. Resilience
- Wrap all Supabase reads/writes in `kommenszlapfSync` and `kommenszlapfAuth` with try/catch; on network failure, silently fall back to localStorage (already partly true, will harden).
- Never throw or trigger a reload on Supabase outage.

## 6. Unverified-account cleanup
- Daily pg_cron job that deletes `auth.users` rows where `email_confirmed_at IS NULL AND created_at < now() - interval '24 hours'`.
- Cascading deletes via existing FK already remove `kommenszlapf_profiles` rows.

## 7. Calendar archive + recently deleted
- Add `archivedAt` to `CalendarEvent` and surface:
  - Archive action in event details dialog.
  - New `RecentlyDeletedEvents` and `ArchivedEvents` sections inside the existing `RecentlyDeletedUnified` page (events were not yet wired in).
- Homepage button to open the new sections.

## 8. Event ↔ Task linking
- Add `linkedTaskId?: string` to `CalendarEvent` and `linkedEventIds?: string[]` to `Task`.
- Event details dialog: "Link to task" picker; shows linked task with unlink button.
- Task details dialog: "Linked events" list with unlink.
- Linked events render under the task in `Index.tsx` like a pseudo-subtask row (read-only, click opens event).

## 9. Refresh button on TaskBurst icon
- On the navigation logo, show a small refresh icon on hover that calls `window.location.reload()`.

## Technical notes
- New edge functions: `lookup-email-by-username` (public), `delete-account` (auth-required). Both use service role internally.
- New migration: pg_cron job for unverified cleanup (requires `pg_cron` + `pg_net` — enable if missing).
- Files touched (approx.): `Navigation.tsx`, `KommenszlapfAccountDialog.tsx`, `kommenszlapfAuth.tsx`, `kommenszlapfSync.ts`, `SettingsDialog.tsx`, `App.tsx`, new `pages/AuthConfirmed.tsx`, new `pages/ResetPassword.tsx`, `RecentlyDeletedUnified.tsx`, `Index.tsx`, `TaskDetailsDialog.tsx`, `EventDetailsViewDialog.tsx`, event/task types.

## Question before building
This is ~15 features. Want me to ship it all in one pass, or split into batches (e.g. auth first, then settings, then calendar/linking)? One pass is faster but means a single huge diff.
