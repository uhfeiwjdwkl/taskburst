---
name: kommenszlapf-auth
description: "Sign in with Kommenszlapf" — unified Supabase auth shared across every *.kommenszlapf.website subdomain. Covers the shared-cookie session storage, KommenszlapfAuthProvider + useKommenszlapfAuth hook, username-or-email sign-in via the lookup-email-by-username edge function, email confirmation and password reset flows, and the account management dialog (change username/email/password, export, delete). Apply when adding auth to any sibling app so a single session works across all of them.
---

# Sign in with Kommenszlapf

All apps under `*.kommenszlapf.website` share ONE Supabase project (`zgbodpdoflhephyyzhex`) and ONE session. Signing in on any sibling signs the user in everywhere; signing out signs them out everywhere.

## How the shared session works

Supabase JS stores sessions in `localStorage` per-origin, which does NOT cross subdomains. Fix: use a cookie-backed `Storage` adapter scoped to `.kommenszlapf.website`.

- Same **cookie name** (= `storageKey`) on every app: `sb-zgbodpdoflhephyyzhex-auth-token`.
- Cookie attributes: `Domain=.kommenszlapf.website; Path=/; Secure; SameSite=Lax; Max-Age=31536000`.
- On `localhost` / preview hosts, fall back to `localStorage` so dev keeps working.

## Files to drop into every sibling app

### `src/integrations/supabase/cookieStorage.ts`

```ts
const ROOT_DOMAIN = "kommenszlapf.website";
const useCookies = () =>
  typeof window !== "undefined" && window.location.hostname.endsWith(ROOT_DOMAIN);

function readCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()\[\]\\/+^]/g, "\\$&") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : null;
}
function writeCookie(name: string, value: string) {
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Domain=.${ROOT_DOMAIN};` +
    ` Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
}
function deleteCookie(name: string) {
  document.cookie =
    `${name}=; Domain=.${ROOT_DOMAIN}; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}

export const cookieStorage = {
  getItem: (k: string) => useCookies() ? readCookie(k) : localStorage.getItem(k),
  setItem: (k: string, v: string) => useCookies() ? writeCookie(k, v) : localStorage.setItem(k, v),
  removeItem: (k: string) => useCookies() ? deleteCookie(k) : localStorage.removeItem(k),
};
```

### `src/integrations/supabase/client.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { cookieStorage } from "./cookieStorage";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const STORAGE_KEY = "sb-zgbodpdoflhephyyzhex-auth-token"; // MUST match across siblings

// One-time migration: promote existing localStorage session into the shared cookie.
if (typeof window !== "undefined" && window.location.hostname.endsWith("kommenszlapf.website")) {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && !document.cookie.includes(`${STORAGE_KEY}=`)) {
    cookieStorage.setItem(STORAGE_KEY, existing);
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: cookieStorage,
    storageKey: STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

`.env` (auto-populated by the Lovable Supabase connection):
```
VITE_SUPABASE_URL=https://zgbodpdoflhephyyzhex.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key — safe in client>
VITE_SUPABASE_PROJECT_ID=zgbodpdoflhephyyzhex
```
Never ship the service-role key in a frontend.

## Auth provider + hook

`src/lib/kommenszlapfAuth.tsx` exposes `KommenszlapfAuthProvider` and `useKommenszlapfAuth()` returning `{ user, session, profile, loading, signUp, signIn, resetPassword, refreshProfile, signOut }`.

Rules (do not break):
- Register `supabase.auth.onAuthStateChange` FIRST, then call `supabase.auth.getSession()`. Do not `await` supabase calls inside the `onAuthStateChange` callback — defer with `setTimeout(..., 0)` to avoid deadlocks.
- `signIn({ identifier, password })` accepts either an email or a username:
  - Contains `@` → `supabase.auth.signInWithPassword({ email, password })`.
  - Otherwise → `supabase.functions.invoke("lookup-email-by-username", { body: { username, password } })`, then `supabase.auth.setSession({ access_token, refresh_token })`. This keeps username→email mapping server-side so usernames can't enumerate emails.
- `signUp` passes `emailRedirectTo: ${origin}/auth/confirmed` and `data: { username }` so the DB trigger `kommenszlapf_handle_new_user` can seed `kommenszlapf_profiles`.
- `resetPassword(email)` uses `redirectTo: ${origin}/reset-password`.
- On sign-in, activate the app's sync layer (e.g. `activateSync(uid)`) and fetch the profile row from `kommenszlapf_profiles`. On sign-out, deactivate sync and clear profile.

## Database (already exists in the shared project — reuse, don't recreate)

- `public.kommenszlapf_profiles(user_id uuid PK → auth.users, username text unique, email text, ...)`
- Trigger `kommenszlapf_handle_new_user` on `auth.users` inserts a profile row from `raw_user_meta_data.username`.
- `kommenszlapf_cleanup_unverified()` prunes unconfirmed accounts after 24 h.
- Edge functions: `lookup-email-by-username` (username sign-in) and `delete-account` (self-serve deletion). Do NOT re-deploy these from a sibling app.

If a sibling needs its own tables, scope rows by `user_id = auth.uid()` via RLS. Never store roles on the profile table — use a separate `user_roles` table per the standard pattern.

## Account UI in the sibling app

Ship a `KommenszlapfAccountDialog` with:
- **Signed out**: three tabs — Sign in (email OR username + password), Create account (username + email + password ×2), Forgot password. Sign-in tab shows a warning that local data on this device will be replaced with account data.
- **Signed in**: shows `username` + `email`, and buttons for Export account data, Change username, Change email, Change password, Delete account, Sign out. All destructive/mutating actions require re-entering the current password twice and reverifying via `supabase.auth.signInWithPassword` before proceeding.
- Expose two entry points from `Navigation`: `KommenszlapfAccountButton` (button style) and `KommenszlapfAccountMenuItem` (dropdown-friendly).

## Required routes

- `/auth/confirmed` — landing after email confirmation. Simple success card + "Return to <app> home".
- `/reset-password` — public route. Checks `type=recovery` in the URL hash, then calls `supabase.auth.updateUser({ password })`. Without this page, recovery links auto-log the user in without letting them reset.

## Supabase Dashboard checklist (one-time per sibling)

In project `zgbodpdoflhephyyzhex` → Authentication → URL Configuration → Redirect URLs, add:
- `https://<sibling>.kommenszlapf.website/*`
- `https://<sibling>.kommenszlapf.website/auth/confirmed`
- `https://<sibling>.kommenszlapf.website/reset-password`

Leave Site URL as `https://kommenszlapf.website`.

## Gotchas

- Production MUST be HTTPS — the cookie is `Secure`.
- `storageKey` and cookie `Domain` must match byte-for-byte across siblings.
- Cross-**root**-domain SSO is out of scope; this only works within `.kommenszlapf.website`.
- Never expose or duplicate `service_role`; edge functions use it internally via `Deno.env`.
- Sign-out from any sibling clears the shared cookie — expect all tabs on all subdomains to drop the session on the next auth event.