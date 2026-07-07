## Goal

One login shared between `kommenszlapf.website` and `noventrum.kommenszlapf.website`, using the **same Supabase project** (`zgbodpdoflhephyyzhex`). Sign in on either app → signed in on both. Sign out on either → signed out on both.

Since noventrum lives in a different Lovable account, this plan gives you **everything the noventrum team needs to paste in**, plus what I'll change here.

---

## How it works

Supabase JS stores the session in `localStorage`, which is **per-origin**. To share it across subdomains, both apps switch to a **cookie-storage adapter** scoped to `.kommenszlapf.website`. Same cookie name, same domain → same session on both apps. No redirects, no OAuth handoff.

```text
  Cookie: sb-zgbodpdoflhephyyzhex-auth-token   Domain=.kommenszlapf.website
    ├── kommenszlapf.website               → reads cookie → signed in
    └── noventrum.kommenszlapf.website     → reads cookie → signed in
```

---

## Part A — Changes I'll make in this (Kommenszlapf) project

1. **New file `src/integrations/supabase/cookieStorage.ts`** — a `Storage`-shaped adapter:
   - On production hostnames ending in `kommenszlapf.website`, reads/writes cookies with `Domain=.kommenszlapf.website; Path=/; Secure; SameSite=Lax; Max-Age=31536000`.
   - On `localhost` / Lovable preview URLs, falls back to `localStorage` so dev keeps working.
2. **Update `src/integrations/supabase/client.ts`** to pass:
   ```ts
   auth: {
     storage: cookieStorage,
     storageKey: 'sb-zgbodpdoflhephyyzhex-auth-token',
     persistSession: true,
     autoRefreshToken: true,
     detectSessionInUrl: true,
   }
   ```
3. **One-time migration**: if the old `localStorage[sb-…-auth-token]` exists but the cookie doesn't, copy it into the cookie then delete the localStorage copy. Keeps currently-signed-in users signed in.
4. **Sign-out** already goes through `supabase.auth.signOut()`, which calls the adapter's `removeItem` → cookie deleted on the parent domain → both apps signed out.

No schema changes. No changes to `kommenszlapf_profiles`, `kommenszlapf_user_data`, RLS, or the `lookup-email-by-username` edge function.

---

## Part B — Everything the noventrum team needs

### B1. Environment variables (identical to kommenszlapf)

```
VITE_SUPABASE_URL=https://zgbodpdoflhephyyzhex.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYm9kcGRvZmxoZXBoeXl6aGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjExNTEsImV4cCI6MjA5MDk5NzE1MX0.aPCRwlg7A7ZErwnMBWuvo0ZwcA7k3Ol49276PCPFVpE
VITE_SUPABASE_PROJECT_ID=zgbodpdoflhephyyzhex
```

The anon key is safe in client code. Do **not** put the service-role key in noventrum's frontend.

### B2. Install

```
bun add @supabase/supabase-js
```

### B3. Drop-in file — `src/integrations/supabase/cookieStorage.ts`

```ts
// Cookie-backed storage adapter so the Supabase session cookie is shared
// across all *.kommenszlapf.website subdomains.
const ROOT_DOMAIN = "kommenszlapf.website";

function useCookies(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(ROOT_DOMAIN);
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()\[\]\\/+^]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
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
  getItem: (key: string) =>
    useCookies() ? readCookie(key) : window.localStorage.getItem(key),
  setItem: (key: string, value: string) =>
    useCookies() ? writeCookie(key, value) : window.localStorage.setItem(key, value),
  removeItem: (key: string) =>
    useCookies() ? deleteCookie(key) : window.localStorage.removeItem(key),
};
```

### B4. Drop-in file — `src/integrations/supabase/client.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import { cookieStorage } from "./cookieStorage";

const SUPABASE_URL = "https://zgbodpdoflhephyyzhex.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const STORAGE_KEY = "sb-zgbodpdoflhephyyzhex-auth-token"; // MUST match kommenszlapf

// One-time migration from localStorage → shared cookie
if (typeof window !== "undefined" && window.location.hostname.endsWith("kommenszlapf.website")) {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  const cookiePresent = document.cookie.includes(`${STORAGE_KEY}=`);
  if (existing && !cookiePresent) {
    cookieStorage.setItem(STORAGE_KEY, existing);
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieStorage,
    storageKey: STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

The **`storageKey` must be exactly `sb-zgbodpdoflhephyyzhex-auth-token`** — that's what kommenszlapf uses, and the two apps must agree.

### B5. Auth UI in noventrum

Simplest option: link users to kommenszlapf's sign-in page. Once they sign in there, they come back to noventrum already signed in (cookie is shared). Example:

```tsx
<a href={`https://kommenszlapf.website/?returnTo=${encodeURIComponent(location.href)}`}>
  Sign in with Kommenszlapf
</a>
```

Or noventrum can build its own sign-in form using the same `supabase.auth.signInWithPassword(...)` — it hits the same Supabase project and produces the same shared cookie either way.

Reading the user in noventrum:

```ts
const { data: { session } } = await supabase.auth.getSession();
supabase.auth.onAuthStateChange((_e, s) => { /* update UI */ });
```

Signing out (from either app) clears the cookie for both:

```ts
await supabase.auth.signOut();
```

### B6. Supabase Dashboard changes (do once)

In the Supabase dashboard for project `zgbodpdoflhephyyzhex`:

- **Authentication → URL Configuration → Redirect URLs**, add:
  - `https://noventrum.kommenszlapf.website/*`
  - Any specific callback pages noventrum uses (e.g. `/auth/confirmed`, `/reset-password`).
- **Site URL**: leave as `https://kommenszlapf.website` (used only as a fallback).

### B7. RLS / data

The two apps share `auth.uid()`. Noventrum should either:
- Use its own tables with `user_id = auth.uid()` policies, or
- Use `kommenszlapf_user_data` with a distinct `app` value (e.g. `app = 'noventrum'`) — existing RLS already scopes rows to the owning user.

### B8. Gotchas

- Both apps **must** be served over HTTPS in production — the cookie is `Secure`.
- Cookie is scoped to `.kommenszlapf.website` only; a different root domain would need a full OAuth-style handoff (out of scope).
- If a user is already signed into kommenszlapf via localStorage when this ships, the one-time migration in B4 promotes them to the shared cookie on their next visit.
- Don't change `storageKey` on either side — they must match.

---

## Out of scope

- No schema changes, no new tables, no edge-function changes.
- No cross-**root**-domain SSO.
- No changes to kommenszlapf's username sign-in flow — the resulting session is shared automatically.
