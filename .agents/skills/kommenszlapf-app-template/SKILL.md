---
name: kommenszlapf-app-template
description: Structure, theming, navigation, and shell conventions for apps in the kommenszlapf.website family (top nav with live clock, Return-to-kommenszlapf hover menu, semantic HSL design tokens with dark mode + color themes, settings-driven visible/orderable pages, PIN protection overlay, InstanceBlocker). Apply when building or restyling any subdomain app under kommenszlapf.website so it feels like a sibling of TaskBurst.
---

# Kommenszlapf App Template

A shared shell for apps that live under `*.kommenszlapf.website`. Use it for every new sibling app so they look, feel, and navigate the same way.

## App shell

`App.tsx` composition, in this order (outer → inner):

```
InstanceBlocker
  QueryClientProvider
    KommenszlapfAuthProvider           (see kommenszlapf-auth skill)
      TooltipProvider
        Toaster + Sonner
        <PIN overlay when settings.pinProtection && !isUnlocked>
        BrowserRouter
          <Navigation />
          <Routes />
```

- Load `appSettings` from `localStorage` in a `useEffect`. Subscribe to `appSettingsUpdated` and `storage` events so the shell reacts to Settings dialog changes without a reload.
- Apply `settings.darkMode` by toggling `document.documentElement.classList` `dark`.
- Apply `settings.brightness` (0–100) via `document.documentElement.style.filter = brightness(x/100)`.
- Apply `settings.colorTheme` by calling `applyColorThemeToDocument(theme.colors)` from `src/lib/theme.ts` — do NOT hardcode colors.

## Design tokens (index.css)

All colors are HSL semantic tokens in `:root` and `.dark`. Components must use tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`, …) — never `text-white`, `bg-black`, or hex utilities.

Required token set (mirror TaskBurst): `background/foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `success`, `destructive`, `border`, `input`, `ring`, `--radius: 0.75rem`, `--gradient-primary`, `--gradient-success`, `--shadow-glow`, `--transition-smooth`, plus the full `--sidebar-*` set. Dark mode overrides every one.

Extra global rules already in `index.css` to carry over: hide native date-picker icon, custom number-input spinner styles, Radix `[data-radix-popper-content-wrapper] { z-index: 9999 }`, `[role="dialog"]` scrollability caps, and TipTap `.ProseMirror` styles when the app uses rich text.

## Navigation bar

Sticky top nav (`border-b bg-background/95 backdrop-blur ... sticky top-0 z-50`). Left cluster → middle nav → right cluster.

Left cluster, in order:
1. **App name button** (e.g. `TaskBurst`, `Noventrum`) — navigates to `/`. Wrap in a `group` div with:
   - A tiny refresh button (`RefreshCw`) that appears on hover and calls `window.location.reload(true)`.
   - A hover menu (absolute, `group-hover:visible`) with at minimum:
     - `<a href="https://kommenszlapf.website">Return to kommenszlapf.website</a>` — every sibling app MUST have this link.
     - A link to the in-app Guide/Docs page.
2. **Digital clock chip** — monospace time + `Ddd DD/MM/YYYY`, updates every 1s. Respect `settings.timeFormat` (`12h` / `24h`).
3. Optional **analogue clock SVG** gated by `settings.showAnalogueClock`.
4. Optional context badges (e.g. active session, "N today" popover) — app-specific but styled with `Badge` + `Popover`.

Middle nav:
- Driven by `settings.pages: PageConfig[]` with `{ id, name, path, icon, visible, order }`. Filter `visible`, sort by `order`.
- Compute layout each resize: single row if it fits, two rows if not, dropdown if `settings.useDropdownNav` or still too narrow.
- Active state uses `variant={isActive(path) ? 'secondary' : 'ghost'}` from shadcn Button.
- Mobile: always a `DropdownMenu` behind a `Menu` icon.

Right cluster: `Settings` button (opens `SettingsDialog`) + `KommenszlapfAccountButton` (see auth skill). In dropdown/mobile variants use `KommenszlapfAccountMenuItem` instead.

## Settings

`AppSettings` (in `src/types/settings.ts`) includes at minimum: `darkMode`, `brightness`, `colorTheme` (id into `COLOR_THEMES`), `timeFormat`, `showAnalogueClock`, `useDropdownNav`, `pages: PageConfig[]`, `pinProtection`, `pinHash`. Persist to `localStorage['appSettings']` and dispatch `window.dispatchEvent(new Event('appSettingsUpdated'))` after any write.

`COLOR_THEMES` is a list of `{ id, name, colors }` where `colors` is an HSL map applied by `applyColorThemeToDocument`. Adding a theme = adding an entry; never edit component classes.

## PIN protection

When `settings.pinProtection && settings.pinHash && !isUnlocked`:
- Render a fixed `bg-background/80 backdrop-blur-md` overlay (`.pin-blur-overlay` class) at `z-40`.
- Render `<PinProtectionDialog pinHash={...} onSuccess={...} />` on top.
- Hash comparison uses `src/lib/pin.ts` — never store the PIN itself.

## InstanceBlocker

Wrap the whole app in `<InstanceBlocker>` so only one tab per browser drives writes. This prevents localStorage/Supabase-sync races between duplicate tabs.

## Standard routes to scaffold

Every sibling app should ship these at minimum:
- `/` — Home / Index
- `/guide` — In-app documentation
- `/data` — Import/export & backup
- `/auth/confirmed` — Post-signup landing (see auth skill)
- `/reset-password` — Password reset target (see auth skill)
- `*` — `NotFound`

Add app-specific routes on top; register them in both `<Routes>` and `settings.pages` so users can toggle visibility/order in Settings.

## Do / Don't

- DO reuse the semantic token names verbatim so a theme swap in `index.css` restyles the whole app.
- DO keep the `Return to kommenszlapf.website` link in the app-name hover menu on every sibling.
- DO expose page visibility + order through Settings, not hardcoded nav arrays.
- DON'T introduce a different font stack or radius per app — the family looks unified.
- DON'T inline hex colors or Tailwind color utilities (`bg-blue-500`, `text-white`); use tokens.
- DON'T wire auth per app — always go through `KommenszlapfAuthProvider` from the auth skill.