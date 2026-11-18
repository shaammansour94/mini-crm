# AQARY Mini CRM

A Mini CRM with a configurable lead form, persistent SQLite data, and server-enforced Admin/Agent permissions. Administrators configure fields in the Form Builder; create and edit screens render from the saved definition without React changes for each custom field.

[Repository](https://github.com/shaammansour94/mini-crm) · [Video walkthrough · 4:07](docs/videos/aqary-demo.mp4) · [Postman collection](docs/postman/AQARY-CRM.postman_collection.json)

## Features

- Lead creation, details, and editing.
- Name/email search combined with status filtering and server-side pagination with an accurate matching total.
- Three-panel Form Builder with Text, Email, Number, Dropdown, Date, and Checkbox fields.
- Drag-and-drop ordering, accessible Up/Down controls, field properties, and draft preview.
- Conditional visibility and validation, including Loss reason when Status is Lost.
- Stable field IDs and retention of saved values after field renaming, reordering, or removal.
- Undo/Redo and an unsaved-changes confirmation dialog.
- Responsive layouts, mobile builder tabs, loading/error/empty states, and inline validation.

## Run locally

Prerequisites: **Node.js 26.13.1** (see `.nvmrc`), **npm 11.20.0**, and a platform supported by `better-sqlite3`. SQLite runs locally; no external database or paid service is required.

```bash
git clone https://github.com/shaammansour94/mini-crm.git
cd mini-crm
nvm use                         # optional, if using nvm
npm ci
cp .env.example .env            # fresh checkout; preserve an existing .env
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To use another port, run `npm run dev -- --port 3100`.

`db:setup` generates the Prisma 7 client, prepares the SQLite file, applies the included migration, and seeds two demo accounts, **24 fictional leads** across all four statuses, and the initial form definition.

The default `DATABASE_URL` is `file:./dev.db`, resolved from the project root by the CLI and application. Database files, environment files, and generated client/build output are excluded from Git. The seed is repeatable: existing demo records and form customizations are preserved. For a separate dataset, select a new local database file in `.env` and run `npm run db:setup`.

Production preview:

```bash
npm run build
npm run start
```

`.env.example` sets `COOKIE_SECURE=false` for local HTTP previews. Use `COOKIE_SECURE=true` with HTTPS. Keep `.env` and database files private.

## Demo accounts and permissions

These credentials are intentionally public and **for demo use only**. Use fictional data; do not reuse these accounts or passwords for a public production service.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@aqary.demo` | `AqaryDemo2026!` |
| Agent | `agent@aqary.demo` | `AqaryDemo2026!` |

Both roles can create, view, edit, search, and filter all demo leads. Both can read the schema needed to render lead forms. Only Admin can open `/form-builder` and save form configuration; Agent schema writes return `403`.

## Form behavior and persistence

1. Open **Form Builder** as Admin and add a field from the palette.
2. Select a field to edit its label, placeholder, required flag, dropdown options, or visibility condition.
3. Reorder with drag handles or Up/Down controls.
4. Use **Preview** to test the draft without creating a lead.
5. Select **Save form** to make the definition available to create/edit screens.

The core fields `name`, `email`, `status`, and `budget` retain their IDs and types and cannot be removed. Labels and order are editable; placeholders are editable where applicable. Name, email, and status remain required and always visible. Status values are fixed to `New`, `Contacted`, `Qualified`, and `Lost`.

The initial form also contains optional Preferred location and required Loss reason, visible only for Lost. Hidden required fields do not block submission. Existing leads may have empty values for newly added fields; edits validate against the current visible required rules.

Lead core properties are stored as columns for querying, while dynamic values are stored in `Lead.values` JSON using stable IDs. Renaming/reordering preserves those IDs. Removing a custom field removes it from the active schema without deleting old values. Updates merge active visible fields into existing values, retaining hidden and removed-field data. Records and the saved schema persist across server restarts.

## Undo/Redo and unsaved changes

Undo and Redo cover field additions/removals, properties, options, visibility, and ordering. History holds **30 snapshots including the current draft**. Consecutive text edits in the same property are grouped until a 700ms pause, blur, field switch, or structural change. A new edit after Undo clears Redo. Selection, preview, and other UI state are excluded from history.

History starts fresh on initial load and successful Save; failed saves preserve the draft and history. Dirty state compares the draft with the last successfully saved schema. Undoing back to that schema clears dirty state.

Leaving through workspace links or Sign out shows **Stay on page** / **Leave without saving** when dirty. Staying retains the draft; confirming discards it and proceeds. Refresh/tab close uses the browser's standard `beforeunload` prompt. Browser Back/Forward protection depends on Navigation API support and cancelable traversal. Draft history is in memory and does not survive a full reload.

## Architecture

**Stack:** Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui with Radix, TanStack Query, dnd-kit, Prisma 7 with the better-sqlite3 adapter, Zod, and Vitest/React Testing Library.

| Location | Responsibility |
| --- | --- |
| `src/app` | Pages, layouts, and thin Route Handlers |
| `src/features/auth` | Password verification and database-backed sessions |
| `src/features/leads` | Lead UI, API functions, query hooks, and services |
| `src/features/form-builder` | Field definitions, shared validation, dynamic rendering, builder, and draft history |
| `src/components` | Shared UI and navigation confirmation |
| `src/lib` | Prisma client and HTTP helpers |
| `src/proxy.ts` | Builder route access check before rendering |
| `prisma` | Database schema, migration, and seed |
| `tests` | Validation, API/persistence, and UI interaction tests |

Route Handlers authenticate, parse requests, and call feature services. Services enforce business rules and access Prisma. Server-only modules keep database access off the client. TanStack Query manages remote data and cache updates; React state manages drafts and UI state. Request-dependent server content uses Suspense with Next.js Cache Components.

The database has `User`, `Lead`, `FormSchema`, and `Session` models. The additional Session model provides expiry checks and immediate logout revocation. One saved form definition is shared across the workspace.

## API and Postman

Import [AQARY-CRM.postman_collection.json](docs/postman/AQARY-CRM.postman_collection.json), set `baseUrl`, and run **Login — Admin**. Postman retains the session cookie automatically. The collection includes all eight API operations, Agent permission checks, and error examples; creating leads and saving schemas affects the selected database.

| Method | Route | Access / request |
| --- | --- | --- |
| POST | `/api/auth/login` | Public; `{ email, password }` |
| POST | `/api/auth/logout` | Signed in; revokes the session |
| GET | `/api/form-schema` | Either role; saved fields and update time |
| PUT | `/api/form-schema` | Admin; `{ fields: FormField[] }` |
| GET | `/api/leads` | Either role; `search`, `status`, `page`, `pageSize` |
| POST | `/api/leads` | Either role; `{ values: { [fieldId]: value } }` |
| GET | `/api/leads/:id` | Either role; saved lead |
| PUT | `/api/leads/:id` | Either role; `{ values: { [fieldId]: value } }` |

Single-resource responses use `{ data }`; lists use `{ data, total, page, pageSize }`. Search matches name **or** email, combined with status before pagination. Defaults are page 1 and page size 5; maximum page size is 100. Omit `status` to include all statuses.

Errors use `{ message, errors? }`, with lead field errors keyed by stable field ID. Responses include `400` for malformed JSON, `401` for missing/expired sessions, `403` for denied operations, `404` for missing leads, and `422` for invalid values or definitions. The server validates against the persisted schema, not a client-supplied definition. Successful creation returns `201`.

## Security and limitations

- Passwords use salted scrypt hashes with timing-safe comparison. Random 256-bit session tokens are stored only as SHA-256 hashes in the database.
- Eight-hour sessions use HttpOnly, SameSite=Lax, host-only cookies. Cookies default to Secure in production; the local HTTP configuration explicitly overrides this.
- Authentication and role checks run on the server. Logout revokes the database session. Mutation Origin checks supplement SameSite cookies; non-browser clients may omit Origin.
- Strict Zod input validation, persisted-schema validation, Prisma queries, escaped rendering, and generic unexpected-error responses protect the application boundaries.
- Visibility conditions reference an always-visible dropdown, preventing conditional chains and cycles. Up to 60 fields and 50 options per dropdown are supported. Existing field types cannot change.
- Required checkboxes must be checked. Dates must be valid calendar dates from `1970-01-01` through `9999-12-31`.
- Budget is a nonnegative AED estimate with at most two decimal places and a maximum of one trillion. It uses SQLite REAL/JavaScript numbers; accounting-grade precision is outside this demo's scope.
- Both roles share all leads. There is no tenant isolation, autosave, persisted schema-version history, or simultaneous-editor conflict resolution; the last successful schema save wins.
- Public production deployment, login rate limiting, application-level request-body byte limits, registration, password reset, and external CRM integration are outside the implemented scope. A separate public deployment requires additional hardening and replacement of demo accounts.

The dependency audit on **2026-11-18** reported **20 high and 2 moderate affected package records** from two glob-library advisories. These findings remain documented rather than treated as resolved. See the [dated security review](docs/SECURITY_REVIEW.md) for scope, reachability assessment, and remediation limitations.

## Checks and database commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Tests use a temporary SQLite database. They cover schema/core-field protection, visible/hidden required validation, date boundaries, API authorization, session revocation/expiry, retained dynamic values, search/filter totals, conditional form interaction, navigation state, Undo/Redo, save success/failure, and navigation confirmation/cancellation. See [verification details](docs/VERIFICATION.md), including the direct SQLite inspection for SCHEMA-05.

Database steps can also run individually:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Prisma commands use `prisma7.config.ts`. To create a new database migration during development after changing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --config prisma7.config.ts --name descriptive_name
npm run db:generate
```

## Screenshots and walkthrough

[**Watch the application walkthrough (MP4 · 4:07)**](docs/videos/aqary-demo.mp4)

The included video shows the production build with chapter captions and desktop/mobile flows, without audio. See [chapter times and recording details](docs/WALKTHROUGH.md).

| Screen | Desktop | Mobile (390px) |
| --- | --- | --- |
| Leads | [Desktop](docs/screenshots/leads-desktop.png) | [Mobile](docs/screenshots/leads-mobile.png) |
| Form Builder | [Desktop](docs/screenshots/builder-desktop.png) | [Mobile](docs/screenshots/builder-mobile.png) |
| Dynamic lead form | [Desktop](docs/screenshots/lead-form-desktop.png) | [Mobile](docs/screenshots/lead-form-mobile.png) |

## AI assistance

Implementation and verification were assisted by OpenAI Codex.
