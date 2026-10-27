# KADRAN Design Reference — Archive

This folder contains the original user-provided design and roadmap package.
It is not the running application; retain it as a read-only visual/interaction
reference. Do not edit or delete the original prototype source files.

## Current project status

The supplied design has been implemented in the app, including the reported
UI/auth fixes. For the current handoff, completed scope, validation commands,
and the only known remaining check, read the project-root
[`TODO.md`](../TODO.md). The root [`README.md`](../README.md) documents the
current app and API.

The original AI prompt and its “known gaps” below were written before the
implementation. They are historical requirements/reference notes, not a list
of current defects or work remaining.

## Archive contents

| File | Historical reference |
|---|---|
| `design-reference.html` | Original browser prototype with mock data |
| `src/styles.css` | Original design tokens, component styles, and textures |
| `src/body.html` | Prototype screen markup |
| `src/app.js` | Prototype interactions and mock-data behavior |
| `src/index-head.html` | Prototype fonts and document metadata |
| `KADRAN Yol Haritası Yeniden Tasarım ve Yeni Özellikler.pdf` | Initial redesign roadmap |

## Guidance for future agents

- Read the root `TODO.md` and `README.md` first; those are authoritative for
  current status and app behavior.
- Use this folder only to compare intended visuals or interactions. Do not
  replace the app with the standalone prototype.
- The actual data model and API contracts live in `kadran-backend/` and
  `kadran-frontend/src/`; names in the prototype are not API fields.
- Preserve the existing React/Vite and Express/Prisma project structure.
- Do not run database migrations or resets without explicit user approval.
- Do not ask the user to share passwords or commit credentials.
