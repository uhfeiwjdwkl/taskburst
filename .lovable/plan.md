Three independent changes. I'll implement them in this order so each can be tested on its own.

## 1. Timezone: system-time by default, optional manual override

**Behaviour**
- Default stays as today: use the browser's system timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- New toggle in Settings → General: **"Override system timezone"** (off by default).
- When ON, the existing timezone dropdown (already in `TIMEZONE_PRESETS`) becomes enabled. Selecting `Custom UTC Offset…` reveals the numeric offset input already present.
- When OFF, the dropdown is disabled/greyed and the app uses system time.
- **All events, tasks, timetable entries, sync timestamps, deletions, etc. are stored in UTC ISO strings.** Only *display* is converted through the active timezone. This is the groundwork for change #2 (conflict resolution) and change #3 (accurate timeline export).

**Technical**
- Add `overrideTimezone: boolean` to `AppSettings` (default `false`). Keep existing `timezone` + `customUtcOffset` fields.
- Add a helper `src/lib/timezone.ts` exposing `getActiveTimezone(settings)`, `nowUtcIso()`, `toDisplay(utcIso, settings)`, `fromDisplay(localInput, settings)`. All existing `new Date().toISOString()` calls that write to storage already produce UTC — audit and fix any that use local `toISOString()` on locally-parsed date strings.
- Update `SettingsDialog` timezone section: checkbox + disabled state on the dropdown.
- Update the digital + analogue clock, `HomeDayCalendar`, `Calendar` page, `Timetable`, `CurrentEventDisplay`, `CurrentScheduledTask` to render through `toDisplay(...)`.

## 2. Event-based realtime sync with UTC conflict resolution

**Behaviour**
- Replace the current 600ms debounced localStorage-interceptor push with a **change-driven** model:
  - Every write in `kommenszlapfSync` is tagged with `updated_at_utc = new Date().toISOString()` and pushed immediately.
  - When offline, writes queue in `localStorage['kommenszlapf:pendingSync']`. On `online` event (or when Supabase becomes reachable), flush the queue in order.
  - Subscribe to Supabase Realtime `postgres_changes` on `kommenszlapf_user_data` filtered by `user_id=eq.<me>` and `app=eq.taskburst`. On INSERT/UPDATE, if the incoming `updated_at` > local `updated_at` for that key → apply and dispatch `storage` + `appSettingsUpdated` events so the UI reacts without reload. On DELETE, remove local key.
  - **Conflict rule:** "most recent UTC timestamp wins" applied per-key (not per-row-inside-array). Array-of-`{id}` merges keep the per-item timestamp: each item carries its own `updatedAt` (already true for tasks/events/lists via `createdAt`; we add `updatedAt` on write). Merge picks the item with the newer `updatedAt` on `id` collision, so an offline edit made later still wins over an online edit made earlier.

**Technical**
- Migration: add `updated_at timestamptz not null default now()` to `kommenszlapf_user_data` if missing, plus a trigger to bump it on update. Enable Realtime on the table (`alter publication supabase_realtime add table public.kommenszlapf_user_data;`) and `alter table ... replica identity full;`.
- Rewrite `src/lib/kommenszlapfSync.ts`:
  - Remove the debounce; push on each intercepted `setItem`/`removeItem`, tagged with `updated_at`.
  - Add `pendingQueue` persisted to localStorage; flush on `online` and on successful reconnect.
  - Add `subscribeRealtime(userId)` that opens a channel and calls a `mergeIncoming(key, value, updated_at)` function using the same array/object merge strategy already in `activateSync`, but comparing `updatedAt` per item.
- Ensure item shapes carry `updatedAt`. Extend `CalendarEvent`, `Task`, `List`, `Project`, `Assessment`, `Timetable`, `Subtask` types with an optional `updatedAt: string` (UTC ISO). Anywhere the app creates/edits one of those, stamp `updatedAt = new Date().toISOString()`.
- Add a tiny "Syncing…/Synced/Offline" indicator to the nav (next to the account button) so users see it's live.

## 3. Export Day Plan (PDF / PNG / HTML timeline)

**Placement**
- New button **"Export Day Plan"** in:
  - Homepage `HomeDayCalendar` header
  - Calendar page day-view header (`UniversalDayCalendar` or `Calendar.tsx` day header)
- Opens a dialog: **ExportDayPlanDialog**.

**Dialog UX**
1. Date picker (defaults to today).
2. Format radio: **PDF · PNG · HTML**.
3. Colour toggle: **Colour** / **Black & white** (B&W = outlines + text only, no fills/shading).
4. Checklist of every item that would appear on that day: calendar events, tasks scheduled for that day, timetable blocks, assessments due. Each row = checkbox + type badge + title + start–end. All checked by default, "Select all / none" button.
5. "Generate" button.

**Timeline rendering rules (the important part)**
- Collect selected items → normalise into `{ id, type, title, startUtc, endUtc, colour }`.
- Convert to display times using the active timezone from change #1.
- Sort by `startUtc`.
- **Column packing:** walk items in order. Assign each item to the leftmost column whose last item ends ≤ this item's start. Track the number of columns used per overlap group.
- **Vertical layout is content-driven, not time-scale:** each box height = whatever fits `title + start–end + duration` on 2–4 lines with padding (no truncation). Chronology is preserved by **ordering**, not by pixel-to-minute scale.
- **Concurrent stretching:** for every group of items that overlap in real time, compute `groupHeight = max(sum of heights per column)`. Then stretch every column in that group vertically to `groupHeight` by proportionally growing each concurrent item's box, so the group's start/end lines up horizontally across columns. This keeps "these three things happened at the same time" visually true even though the scale is elastic.
- Boxes render side-by-side in their assigned columns with a 1px outline; colour mode fills with the item's colour at low opacity, B&W leaves the fill white.
- Header shows the date + "Day Plan — [App]".

**Output**
- **HTML:** self-contained `.html` with inline `<style>`, downloaded via a Blob URL.
- **PNG:** render the same DOM node with `html-to-image` (`toPng`), download the blob.
- **PDF:** same DOM → `html-to-image` `toCanvas` → `jsPDF` (`addImage`) with A4 portrait, auto-paginate if the timeline overflows one page.
- Filename: `day-plan-YYYY-MM-DD.{pdf|png|html}`.

**New files**
- `src/components/ExportDayPlanDialog.tsx`
- `src/components/ExportDayPlanButton.tsx` (wraps the dialog, drop-in for the two headers)
- `src/lib/dayPlanExport.ts` (collect items, column-pack, stretch, render helpers)
- Depend on `html-to-image` and `jspdf` (both small, already commonly used with Vite).

## Order of work
1. Timezone toggle + `nowUtcIso`/`toDisplay` helpers, wired through settings + clock/calendar reads.
2. Migration + realtime sync rewrite + per-item `updatedAt` + sync indicator.
3. Export Day Plan dialog, button, timeline renderer, PDF/PNG/HTML output.

## Out of scope
- No schema change to per-item tables (tasks etc. still live in `kommenszlapf_user_data.value` JSON).
- No cross-timezone recurrence rewrite — recurring rules still evaluate on the stored anchor date; only display shifts.
- Timeline export is a **fit-to-content** timeline, deliberately not a to-scale gantt.
