# KADRAN Design Reference — Archive

This folder contains the original user-provided design and roadmap package.
It is not the running application; retain it as a read-only visual/interaction
reference. Do not edit or delete the original prototype source files.

## Current project status

The app already contains substantial implementation work, but do not assume the
design or roadmap is fully complete. Audit the whole roadmap PDF against the
current code, then implement the still-missing applicable items. The
project-root [`TODO.md`](../TODO.md) contains the task prompt, safety
constraints, verification commands, and an audit checklist. The root
[`README.md`](../README.md) documents the current app and API.

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

- Read the root `TODO.md` and `README.md` first; follow the handoff prompt and
  verify the current implementation rather than assuming it is complete.
- Use this folder and the roadmap PDF to identify and implement missing
  requirements. Do not replace the app with the standalone prototype.
- The actual data model and API contracts live in `kadran-backend/` and
  `kadran-frontend/src/`; names in the prototype are not API fields.
- Preserve the existing React/Vite and Express/Prisma project structure.
- Do not run database migrations or resets without explicit user approval.
- Do not ask the user to share passwords or commit credentials.
