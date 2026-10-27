# KADRAN — AI Handoff and Remaining Work

This is the current implementation handoff for a developer or coding agent.
Use it instead of inferring project status from the original design package.

## Current status

- Latest implementation commit: `78760be` (`feat: complete Kadran design and auth updates`).
- The design implementation and the user-reported UI fixes are complete.
- Neon connectivity was verified. `npx prisma migrate status` reported
  `Database schema is up to date!`; do not run a migration or reset the database
  unless a new schema change is explicitly requested.
- Frontend lint/build and all 48 backend tests passed after the UI/auth fixes.
- Build still reports a non-blocking JavaScript chunk over 500 KB.
- No real account credentials were used or saved during verification.

## Remaining work

### User-assisted authentication smoke test

- [ ] Ask the user to test signing in with their own account and report whether
      it succeeds. Never request or record their password.
- [ ] If sign-in succeeds, ask them to test registration only if they have an
      email address they intend to use. Do not create a throwaway account in
      their Neon database.
- [ ] If either request fails, capture the exact displayed error and diagnose
      from that message, browser network response, and backend logs. Do not
      guess that a migration is needed: the current Neon migration status was
      up to date.
- [ ] If source changes are needed, add a focused regression test, update this
      file, and rerun the checks below.

This is the only currently known incomplete validation. The app's successful
login/registration cannot be verified without the user's chosen account details
and consent to perform those account actions.

## Implemented scope

- Responsive Dashboard, week/month Calendar, list and card-grid Tasks views.
- Calendar click/drag task creation, compact-empty-hours preference, textures,
  desk illustrations, category visuals, and responsive calendar navigation.
- Task create/edit form components, clock picker, quick durations, live preview,
  recurrence editing, and tag assignment through the editor (not from list rows).
- Settings, light/dark/system appearance, browser-local avatar and default task
  colors, and shared theme-aware buttons/switches.
- Sign-in/register screens with field validation and clearer API/network errors.
- Persisted sessions are validated with `/auth/me` before protected pages render;
  invalid sessions are cleared and protected routes return to sign-in.
- `Design Tools/` is retained as a read-only original visual/roadmap archive.
  Its guide explains which source is historical and where current status lives.

## Verification commands

Run from the repository root:

```powershell
npm.cmd --prefix kadran-frontend run lint
npm.cmd --prefix kadran-frontend run build
npm.cmd --prefix kadran-backend test
git diff --check
```

For a read-only database migration check, run from `kadran-backend`:

```powershell
npx.cmd prisma migrate status
```

Do not run `prisma migrate reset`. Do not apply database changes without
explicit user approval and confirmation of the target Neon branch.

## Project conventions

- Preserve the existing React/Vite frontend and Express/Prisma backend structure.
- Keep task rules consistent between
  `kadran-frontend/src/utils/taskRules.js` and
  `kadran-backend/src/features/task/task.rules.js`.
- The frontend expects the existing API contracts; keep ownership and
  authentication checks on the backend.
- Do not edit or delete the original files in `Design Tools/` unless the user
  explicitly asks to change/remove the source references.
- Keep this handoff current when meaningful work or validation changes.
