# KADRAN — Agent Context File

> This file gives AI assistants (Claude, Cursor, Copilot, etc.) full context about the project.
> **Update this file after every significant change.**

---

## What Is This Project?

KADRAN is a backend REST API for an academic task and calendar management system.
Target users: university students managing lectures, exams, assignments, and personal tasks.

**Current Status:** Backend MVP complete. Tested with Postman. Frontend not started.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules, `"type": "module"`) |
| Framework | Express.js |
| Database | PostgreSQL via Neon (cloud) |
| ORM | Prisma |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| Port | 3000 |

---

## Folder Structure

```
kadran-backend/
├── prisma/
│   └── schema.prisma          # Database models
├── src/
│   ├── server.js              # Express entry point
│   ├── config/
│   │   └── database.js        # Singleton Prisma client
│   ├── shared/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js          # JWT validation → sets req.user
│   │   │   └── errorHandler.middleware.js  # Global error handler
│   │   └── utils/
│   │       └── customErrors.js             # AppError, ValidationError, etc.
│   └── features/
│       ├── auth/
│       │   ├── auth.validator.js    # validateRegister, validateLogin
│       │   ├── auth.db.js           # findUserByEmail, createUser
│       │   ├── auth.service.js      # registerService, loginService
│       │   ├── auth.controller.js   # register, login
│       │   └── auth.router.js       # POST /auth/register, /auth/login
│       ├── category/
│       │   ├── category.validator.js
│       │   ├── category.db.js
│       │   ├── category.service.js
│       │   ├── category.controller.js
│       │   └── category.router.js
│       ├── tag/
│       │   ├── tag.validator.js
│       │   ├── tag.db.js
│       │   ├── tag.service.js
│       │   ├── tag.controller.js
│       │   └── tag.router.js
│       ├── task/
│       │   ├── task.validator.js
│       │   ├── task.db.js
│       │   ├── task.service.js
│       │   ├── task.controller.js
│       │   └── task.router.js
│       └── recurring/
│           ├── recurring.validator.js   # placeholder
│           ├── recurring.db.js          # placeholder
│           └── recurring.service.js     # generateInstances() algorithm
├── .env                        # SECRET — never commit
├── .env.example
└── package.json
```

---

## Architecture Pattern

Every feature follows the same 5-layer pattern:

```
router → validator → controller → service → db
```

- **router** — defines URL + middleware chain
- **validator** — checks incoming data, throws ValidationError if invalid
- **controller** — receives request, calls service, sends response. No logic here.
- **service** — business logic, ownership checks, throws custom errors
- **db** — only Prisma queries, no logic

---

## Database Models

### User
```
id, email (unique), password (bcrypt hashed), timeZone (default: Europe/Istanbul),
createdAt, updatedAt
```

### Category
```
id, name, color (hex e.g. #FF5733), userId (FK)
unique: [userId, name]
```

### Task
```
id, title, description?,
type: TaskType (DERS | SINAV | ODEV | KISISEL),
categoryId (FK → cascade delete),
timeType: TimeType (HOURLY | ALLDAY | REMINDER),
date,
startTime? (HH:MM — only for HOURLY),
endTime?   (HH:MM — only for HOURLY),
reminderTime? (HH:MM — only for REMINDER),
isRecurring (bool),
recurrencePattern?: RecurrencePattern (DAILY | WEEKLY | MONTHLY),
recurrenceDays?: String (e.g. "MON,WED,FRI" — only for WEEKLY),
recurrenceStart?, recurrenceEnd? (null = infinite),
recurrenceDay?: Int (1-31 or -1 for last day — only for MONTHLY),
priority: Priority (LOW | MEDIUM | HIGH, default MEDIUM),
isCompleted (bool, default false),
userId (FK → cascade delete),
createdAt, updatedAt
```

### Tag
```
id, name, userId (FK)
unique: [userId, name]
```

### TaskTag (N:N junction)
```
id, taskId (FK), tagId (FK)
unique: [taskId, tagId]
```

---

## API Endpoints

### Public
```
POST /auth/register    body: { email, password, timeZone? }
POST /auth/login       body: { email, password }
GET  /health
```

### Protected (requires: Authorization: Bearer <token>)

#### Categories
```
GET    /categories
POST   /categories          body: { name, color }
PATCH  /categories/:id      body: { name?, color? }
DELETE /categories/:id
```

#### Tags
```
GET    /tags
DELETE /tags/:id
```

#### Tasks
```
GET    /tasks               query: from?, to?, category?, priority?, tags?, showCompleted?, limit?, offset?
POST   /tasks               body: (see Task model above)
PATCH  /tasks/:id           body: any subset of Task fields
DELETE /tasks/:id
PATCH  /tasks/:id/toggle    toggles isCompleted
POST   /tasks/:id/tags      body: { tagNames: string[] }
DELETE /tasks/:id/tags/:tagId
```

---

## Custom Error Classes

Defined in `src/shared/utils/customErrors.js`. All extend `AppError`.

| Class | HTTP Status | When to use |
|---|---|---|
| `ValidationError` | 400 | Invalid input (missing field, wrong format) |
| `AuthenticationError` | 401 | Missing or invalid token |
| `AuthorizationError` | 403 | Valid token but wrong user (accessing others' data) |
| `NotFoundError` | 404 | Record not found |
| `ConflictError` | 409 | Duplicate (email, category name, etc.) |

**Usage in any service:**
```javascript
import { NotFoundError, AuthorizationError } from '../../shared/utils/customErrors.js';

const task = await findTaskById(id);
if (!task) throw new NotFoundError('Task', id);
if (task.userId !== userId) throw new AuthorizationError();
```

---

## Auth Flow

1. Client sends `POST /auth/login` → gets `{ user, token }`
2. Token is a JWT signed with `JWT_SECRET`, expires in 7 days
3. All protected routes require: `Authorization: Bearer <token>`
4. `auth.middleware.js` verifies the token and sets `req.user = { id, email }`
5. Controllers use `req.user.id` to scope all queries to that user

---

## Key Business Rules

- A user can only access **their own** categories, tasks, and tags
- A task must belong to a category **owned by the same user**
- `timeType = HOURLY` → `startTime` and `endTime` required
- `timeType = REMINDER` → `reminderTime` required
- `timeType = ALLDAY` → no time fields required
- `isRecurring = true` → `recurrencePattern` and `recurrenceStart` required
- `recurrencePattern = WEEKLY` → `recurrenceDays` required (e.g. "MON,WED,FRI")
- `recurrencePattern = MONTHLY` → `recurrenceDay` optional (1–31 or -1 for last day)
- `recurrenceEnd = null` means the task repeats infinitely
- Tags are created automatically on first use (`findOrCreateTag`)
- Tag names are stored lowercase and trimmed
- Deleting a Category cascade-deletes its Tasks
- Deleting a Task cascade-deletes its TaskTags

---

## Recurring Task Logic

The database stores **one row per recurring task** (the pattern, not the instances).
The `recurring.service.js` file exports `generateInstances(task, rangeStart, rangeEnd)` which produces the individual occurrences for a given date range.

This function is intended to run on the **frontend** (`recurringManager.js`), not on every API call.

```javascript
// Example
generateInstances(task, new Date('2024-01-01'), new Date('2024-02-01'))
// Returns: array of task objects, each with a different `date`, and `_isInstance: true`
```

---

## Environment Variables

```env
DATABASE_URL="postgresql://..."   # Neon connection string
JWT_SECRET="..."                  # Random strong secret
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

---

## What Is NOT Done Yet

- [ ] Frontend (Vanilla JS)
- [ ] Seed file (`prisma/seed.js`)
- [ ] Notification / reminder system
- [ ] Conflict detection (overlapping tasks)
- [ ] Password reset flow
- [ ] Rate limiting
- [ ] Input sanitization (XSS protection)
- [ ] Pagination on categories and tags

---

## How to Run

```bash
npm install
npx prisma migrate dev --name init
npm run dev
# → http://localhost:3000
```

---

## How to Update This File

Update this file whenever you:
- Add a new endpoint
- Change a model field
- Add a new feature or module
- Change a business rule
- Complete something from the "Not Done Yet" list
