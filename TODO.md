# KADRAN redesign progress

This file tracks implementation against the supplied design package. Update it
when a meaningful group of work is completed, rather than after every small edit.

## Completed

- [x] Add design tokens, shared UI primitives, and a development-only UI catalog.
- [x] Add server-side task sorting and keep sort options in the task-list URL.
- [x] Add optional user profile fields and connect them to Settings and the UI.
- [x] Add the profile database migration and regenerate Prisma Client. The
  migration has **not** been applied to a database.
- [x] Split task creation/editing fields into focused components without moving
  the existing form state or API submission behavior.
- [x] Apply shared task type, priority, completion, and time-model visuals to
  dashboard rows, calendar events/spans, and the task list.
- [x] Align the dashboard, week/month calendar, filters, task list, and calendar
  detail modal with the shared light-theme tokens.
- [x] Add an accessible "Compact empty hours" toggle to the week calendar and
  remember its setting in browser storage.
- [x] Refresh the shared navigation, settings page, and login/register pages
  with the design tokens and reusable form controls.
- [x] Add accessible selected-state announcements to task form controls and
  improve the weekly recurrence fields on narrow screens.
- [x] Add a compact mobile navigation row for authenticated users.
- [x] Keep the weekly calendar columns readable on narrow screens with an
  independently horizontally scrollable week grid.
- [x] Add click-to-create in empty weekly time slots and prefill the selected
  date, start time, and suggested one-hour duration in the existing task form.
- [x] Add drag-to-create time selection, a responsive single-day mobile week
  view, and calendar/day navigation.
- [x] Complete the remaining reference visual details: subtle paper grain,
  calendar texture and desk illustration, high-priority folded corners, and
  the anytime dotted marker.
- [x] Add the reference clock-dial time picker while retaining native time
  entry and form validation.
- [x] Add browser-local light/dark/system appearance preferences.
- [x] Add a live task preview, quick timed-task duration controls, and theme-aware task forms.
- [x] Add browser-local avatar and per-task-type default colors, applying task colors consistently across views.
- [x] Check Dashboard, Tasks, Calendar (week/month), Settings, and task form at
  390, 1024, and 1440 px; none caused page-level horizontal overflow.
- [x] Re-check live preview, timed duration selection, Settings color controls,
  and responsive overflow at 390, 1024, and 1440 px.
- [x] Run frontend lint, production build, and `git diff --check`.
- [x] Verify stored login sessions against `/auth/me` before rendering protected pages; clear expired sessions.
- [x] Improve sign-in and registration error feedback, including backend development details and connection failures.
- [x] Complete shared theme styling in task form tag controls, switches, and submit actions.
- [x] Add list/grid layouts to Tasks and remove tag mutation controls from list rows.
- [x] Keep the Dashboard "Active now / Up next" panel visible with a useful empty state and add its desk illustration.
- [x] Add cork-style calendar workspace texture and align the calendar page within the shared layout.
- [x] Validate the reported fixes with frontend lint, production build, and browser checks.

## Pending external validation

- [ ] Verify sign-in and registration against the configured backend/database.
      The backend was not running during browser checks. The optional profile
      migration remains unapplied; if the server detail reports missing
      `displayName` or `headline` columns, apply it only after confirming the
      intended database.

## Notes

- Keep changes within the existing React pages/components and backend feature
  structure.
- Do not apply database migrations or reset databases without explicit approval.
- The `Design Tools/` directory contains the supplied design references.
- Responsive browser checks used a temporary local test session and a mocked
  Settings response; no real task data or backend API was changed.
- Task form behavior remains in the existing frontend flow; avatar and default
  task colors are browser-local and do not require backend or database changes.
- A database migration for optional profile columns exists but has not been
  applied. If authentication returns a server-side database-column error,
  apply the pending backend migration to the intended database before retrying.
