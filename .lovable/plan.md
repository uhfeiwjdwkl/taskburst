This is a large multi-area change set. Below is the plan grouped by area, files to touch, and implementation approach. No type definitions, the universal day calendar, main calendar page, or timetable page will be modified.

## 1. Date pickers beside inputs (Add dialogs)

**Files:** `AddTaskDialog.tsx`, `AddEventDialog.tsx`, `AddAssessmentDialog.tsx`, `AddListDialog.tsx`, `AddProjectDialog.tsx`

For every `<Input type="date">` / `datetime-local`:
- Wrap in a flex row with the input on the left and a `Popover` trigger `Button` (CalendarIcon) directly beside it.
- Popover content uses the shadcn `Calendar` component (same as main Calendar page) with `mode="single"` and `pointer-events-auto`.
- Selecting a date writes back to the same state setter used by the input (preserves any time portion for datetime-local fields). No validation logic changes.

## 2. Today highlight + current-time line in timetables

**Files:** `TimetableGrid.tsx` (rigid), `FlexibleTimetableGrid.tsx`

- Compute `todayIndex` = column whose dayOfWeek matches `new Date().getDay()`. For fortnightly timetables, only highlight if the column's actual calendar date equals today (use timetable start date + week offset).
- Apply `bg-primary/15` (semantic token) to that column's container.
- Overlay a red horizontal line (`absolute left-0 right-0 h-px bg-red-500`) at `top: ((nowMinutes - startMinutes) / totalMinutes) * gridHeightPx`. Update via `setInterval` every 60s in a `useEffect`.

## 3. Navigation: analogue clock + pills

**Files:** `Navigation.tsx`, `types/settings.ts` is read-only per instruction — instead extend the runtime settings via `useAppSettings` hook (add `showAnalogueClock` with default false, persisted in localStorage) without touching the type file (use optional chaining / loose typing).

- Mini SVG analogue clock (~28px): three rotated `<line>` hands. `useEffect` with `setInterval(..., 1000)` updates a `now` state; angles computed inline.
- Visibility gated on `settings.showAnalogueClock`. `SettingsDialog.tsx` gets a `Switch` to toggle.
- Two pills in top bar (right side):
  - **Active session pill**: reads existing active session state (from localStorage `activeSession` or context already used by `Timer`). Shows session task/subtask name. Click → `Popover` listing the active task + linked subtasks.
  - **Remaining today pill**: counts tasks (not completed, dueDate == today) + events (today, end > now). Click → `Popover` listing them.
- All data sourced from already-loaded localStorage keys; no new fetches beyond reads of existing keys at mount + a window event listener for updates.

## 4. Homepage day calendar (`HomeDayCalendar.tsx` only)

- **(1) Auto-center current time on mount/date change**: `useEffect([displayDate])` sets `scrollRef.current.scrollTop = currentTimeY - containerHeight/2`.
- **(2) Prev/Next day buttons**: local `displayDate` state (default today). `<` / `>` buttons in header. All filtering uses `displayDate` instead of `new Date()`.
- **(3) Normal/Pan/Zoom toggle**: `ToggleGroup` with three items.
  - Pan: pointer-down → track deltaY → `scrollTop -= dy`.
  - Zoom: wheel handler adjusts `zoomLevel` (vertical) or `hZoom` if shiftKey; applied via inline `style={{ height: hourPx * zoomLevel }}` on hour rows and a wrapper width scale.
  - Normal: no overrides.

## 5. List reorder (`EditListDialog.tsx`)

- Remove up/down arrow buttons.
- Add `GripVertical` drag handle per row; implement HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) reordering items in local state, persist to existing `order` field on drop. Mirrors task reordering pattern.

## 6. Timer fixes (`Timer.tsx`)

- **(5) Cancel during end-session popup must save**: in the end-session dialog's Cancel/X handlers, call the same `saveSessionToHistory()` used by the confirm path before closing, instead of discarding.
- **(7) Auto-end at estimated time**: track elapsed vs `task.estimatedMinutes`. When reached, `setIsPaused(true)` and open a "Do you need more time?" `AlertDialog` with an input for additional minutes + "Add" and "Finish" buttons. "Add" extends estimated time and resumes; "Finish" runs normal end flow.

## 7. Now-happening card (`CurrentEventDisplay.tsx` / `CurrentScheduledTask.tsx` / `TimetableCurrentBlock.tsx`)

- Identify the component rendering the current card on the homepage (likely `CurrentScheduledTask.tsx`).
- Reinstate a tick-to-complete `Button` on subtask rows wired to existing subtask completion handler.
- Compute concurrent items: filter all loaded events/tasks/subtasks where `start <= now < end`. Render each in the card, not just the first.

## Technical notes

- All colors via semantic tokens (`bg-primary/15`, `text-destructive`/red used only for the time line where literal red is required by spec — using `bg-red-500` per the spec's "red horizontal line").
- Settings persistence reuses existing `useAppSettings` hook; the `showAnalogueClock` field will be read with a fallback default and written via the existing setter, treating settings as `Record<string, any>` to avoid editing the type file.
- Drag reorder uses native HTML5 DnD (no new deps).
- Runtime error `JSON.parse(...).filter is not a function` will be fixed opportunistically with `Array.isArray` guards in any file touched by this work.

## Out of scope (not modified)

- `UniversalDayCalendar.tsx`, `pages/Calendar.tsx`, `pages/Timetable.tsx`, all files in `src/types/`.
