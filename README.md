# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Sprint 2 is merged to `main`; Sprint 3 meeting management is integrated and awaiting Sprint acceptance
- **Project board:** [MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)

## Overview

MahjongFlow connects the club's operational workflow:

```text
Meeting → Decision → Task → Event → Registration → Check-in → Dinner verification
```

The delivered and integrated baseline currently includes:

- protected committee authentication with predefined `committee` and `authorised` roles;
- server-side authorisation, Supabase RLS, shared backoffice navigation, and safe UI feedback states;
- validated meeting creation, detail, update, and deterministic history flows;
- ordered discussion points and key decisions with atomic PostgreSQL persistence;
- fictional local seed data, repeatable migrations, permission tests, and acceptance-test infrastructure.

Task management, event preparation, registration, QR check-in, attendance, and dinner eligibility
remain approved MVP roadmap work; they are not yet part of the current delivered baseline.

The approved scope and exclusions are defined in the [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md).

## Canonical user stories

These six Story IDs are the canonical business User Stories used by the
[GitHub Project](https://github.com/users/Josscui516/projects/5), Product Backlog,
Sprint Backlog, and implementation Issues. Authentication, authorisation, shared UI states,
privacy controls, and test infrastructure are supporting Enablers rather than additional
business stories.

| Story ID | User Story | Project mapping |
|---|---|---|
| `US-01` — Record meetings | **As a committee member, I want to save meeting discussions and decisions so that I can accurately review them after the meeting.** | Epic #2; Issues #12–#14 |
| `US-02` — Create tasks from decisions | **As a committee member, I want to convert a meeting decision directly into a task so that action items are not lost.** | Epic #3; Issues #23–#25 |
| `US-03` — Follow up tasks | **As a committee member, I want to quickly see my assigned, due-soon, and overdue tasks so that I can plan work and address risks.** | Epic #4; Issues #15, #16, #20–#22 |
| `US-04` — Prepare events | **As a committee member organising an event, I want to manage event details and preparation tasks together so that I can understand preparation progress.** | Epic #5; Issues #17–#19 |
| `US-05` — Record registration and attendance | **As an authorised user, I want to distinguish registered participants from actual attendees so that participation records are accurate.** | Epics #6–#7; Issues #26–#34 |
| `US-06` — Verify dinner eligibility | **As an authorised user, I want to verify dinner eligibility from confirmed attendance so that dinner is not issued incorrectly.** | Epic #8; Issues #35–#37 |

The complete acceptance criteria for `US-01`–`US-06` remain in the
[MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md),
while the [backlog and sprint management baseline](docs/product/BACKLOG_AND_SPRINT_MANAGEMENT.md)
defines their Project field and Issue mappings.

## Current status

Sprint 2 was merged to `main` through Sprint PR #52. It established the authenticated backoffice,
the `committee` and `authorised` role model, protected route and service boundaries, the core MVP
schema and RLS policies, shared loading/error/form states, repeatable local migrations, and the
integrated quality pipeline.

Sprint 3 meeting-management work packages #12, #13, #56, and #14 have been merged into
`sprint/3-meeting-management` through PRs #61, #59, #58, and #57. The integration branch supports
meeting creation, refresh-safe detail and update flows, ordered discussion points and decisions,
deterministic meeting history, anonymous denial, and a non-destructive meeting boundary. Atomic
meeting and agenda writes are delivered through timestamped Supabase migrations and authenticated
security-invoker RPCs.

The current local integration passes lint, typecheck, 206 application tests, 120 acceptance tests,
222 database assertions, database concurrency checks, database lint and drift checks, a production
build, and an authenticated Chrome create/edit/agenda/history flow using fictional data. Sprint 3 is
not yet complete: Epic #2 and child Issues #12, #13, #14, and #56 remain open, the Sprint-level US-01
acceptance record is still pending, and the Sprint integration branch has not been merged to `main`.

Production (current `main` / Sprint 2 baseline):
[mahjong-flow.vercel.app](https://mahjong-flow.vercel.app)

## Technology

| Area | Baseline |
|---|---|
| Application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS v4 |
| Database and authentication | Supabase PostgreSQL and Auth |
| Authorisation | Server-side checks and Supabase RLS |
| Deployment | Vercel and Supabase |
| Collaboration | GitHub Issues, Projects, and Pull Requests |

The lockfile fixes Next.js `16.3.0`, React `19.2.8` and the compatible toolchain.

## Prerequisites

- Git and repository read access;
- Node.js `24.x` and npm `11.16.0`;
- Docker Desktop for the local Supabase development stack;
- access to the hosted MahjongFlow Supabase project only for shared integration or deployment work;
- Vercel project access only for deployment administration.

Use the committed `.nvmrc`, npm and `package-lock.json`; do not add another package manager or
lockfile.

## Quick start

### First local setup

Before starting, install the Node.js and npm versions listed in Prerequisites, install Docker
Desktop, and make sure Docker Desktop is running.

```bash
git clone https://github.com/Josscui516/MahjongFlow.git
cd MahjongFlow
npm ci
cp .env.example .env.local
npm run db:start
npm run db:reset
```

On PowerShell, use `Copy-Item .env.example .env.local`. `db:start` creates the local Supabase
services. The initial `db:reset` then applies the repository migrations in order and loads the
fictional seed data.

The seed includes the single shared local `admin@mahjongflow.com` administrator login. Its bcrypt
password hash is stored in the seed, so the account remains available after every `db:reset`; the
plaintext password is intentionally not stored in the repository. Obtain the shared password through
the team's private development channel. This account is for local development only.

The default `db:start` command excludes the Supabase Vector log collector. On Windows, that
collector requires Docker Desktop to expose the Docker daemon on unauthenticated TCP port 2375;
without it, the container repeatedly restarts. Excluding this logging-only service does not disable
PostgreSQL, Auth, REST, Realtime, Storage, Studio, or PostgreSQL vector capabilities.

Run `npx supabase status` to view the local API URL and publishable key, then add the corresponding
values to the Git-ignored `.env.local` file:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key shown by npx supabase status>
SUPABASE_SECRET_KEY=
```

Do not copy or commit the secret/service-role key, database password, or connection strings shown
by `supabase status`. Leave `SUPABASE_SECRET_KEY` empty by default. After completing the local
configuration, start the application:

```bash
npm run dev
```

### Start an existing local setup

Make sure Docker Desktop is running, then run the following commands from the existing checkout:

```bash
cd MahjongFlow
npm run db:start
npm run dev
```

If local Supabase is already running, `db:start` reports that PostgreSQL is running and does not
rebuild the database. Otherwise, it restarts the existing local services and data. Do not run
`db:reset` during routine startup because it clears and rebuilds the local database. If only
`npm run dev` was previously stopped and the database is still running, run `npm run dev` directly.
The intentionally excluded Vector log collector is not required for normal application development.

### Verify the startup

Open <http://localhost:3000> and verify Supabase reachability:

```bash
curl --fail http://localhost:3000/api/health/supabase
```

PowerShell equivalent: `Invoke-RestMethod http://localhost:3000/api/health/supabase`. The expected
status is `ok`. Run the baseline checks before handoff:

```bash
npm run lint
npm exec tsc -- --noEmit
npm run build
```

Detailed setup, troubleshooting and platform procedures live in the
[environment](docs/operations/ENVIRONMENT_CONFIGURATION.md),
[database](docs/operations/DATABASE_MIGRATIONS.md), and
[deployment](docs/operations/VERCEL_DEPLOYMENT.md) guides.

## Security essentials

- Use only fictional or anonymised participant data in development, tests, documentation, and demonstrations.
- Never commit credentials, tokens, real environment values, or real participant records.
- Enforce sensitive access in both server-side code and Supabase RLS; hiding UI is not authorisation.
- Committee users may see aggregate attendance counts, but participant details require the `authorised` role.
- Store check-in token digests only, keep secret keys server-side, and apply database changes through timestamped migrations.

## Key documentation

| Document | Purpose |
|---|---|
| [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md) | Authoritative scope, roles, roadmap, and acceptance baseline |
| [Backlog and sprint management](docs/product/BACKLOG_AND_SPRINT_MANAGEMENT.md) | Product Backlog, Current Sprint, Kanban, fields, and canonical User Stories |
| [Week 1 plan](docs/plans/week-1/WEEK_1_IMPLEMENTATION_PLAN.md) | Five-day preparation and setup plan |
| [Sprint 2 acceptance record](docs/plans/week-2/M1_ACCEPTANCE_RECORD.md) | Authentication, role, database, shared UI, and quality-gate evidence |
| [Sprint 3 implementation plan](docs/plans/week-3/WEEK_3_IMPLEMENTATION_PLAN.md) | Meeting work packages, integration contracts, and remaining Sprint acceptance |
| [P0 backlog](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_3_P0_PRODUCT_BACKLOG.md) | Epics, Issues, acceptance conditions, and dependencies |
| [Database ERD](docs/plans/week-1/artifacts/day-3/DAY_3_STEP_3_DATABASE_ERD.md) | Entities and core business relationships |
| [Permission matrix](docs/plans/week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md) | Role permissions and enforcement points |
| [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md) | Branch, review, testing, and merge rules |

## Contributing

```text
Sprint branch from main
→ Issue branches → work-package PRs → non-author review → Sprint branch
→ integrated Testing → Sprint PR → main
```

Do not commit directly to `main`, and do not target a work-package PR at `main`. Every branch and Pull Request must reference a real Issue; the weekly plan identifies the Sprint branch and integration/acceptance Issue. Database or permission changes require migrations and role-specific tests. See the [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md).

New repository documentation, plans, handoffs, ADRs, runbooks, templates, and substantive new sections must be written in Chinese. Commit messages and GitHub Issue and Pull Request bodies must be written in English. Existing historical documents may retain their current language when they are not being substantially rewritten.

## Team

FIT3161 Team S1_CS_01: Joshua Xingjian Cui, Li Zhang, Shiying Liao, Xuanwei Xu, and Yubo Cai.

## Licence

This academic project has no open-source licence and may not be copied, redistributed, or reused without permission.
