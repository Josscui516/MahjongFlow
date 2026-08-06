# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Day 4 steps 1–8 complete; independent clean-install verification remains
- **Project board:** [MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)

## Overview

MahjongFlow connects the club's operational workflow:

```text
Meeting → Decision → Task → Event → Registration → Check-in → Dinner verification
```

The MVP provides:

- committee authentication with predefined `committee` and `authorised` roles;
- traceable meetings, decisions, tasks, deadlines, and dashboard summaries;
- weekly session and tournament planning with authorised registration management;
- event-specific QR check-in with window and duplicate protection;
- attendance-derived dinner eligibility for authorised users.

The approved scope and exclusions are defined in the [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md).

## Current status

Days 1–3 are complete. The MVP scope, backlog, UX flows, 11-entity data model, permissions, privacy rules, and migration plan have passed review. Day 4 has produced the initial runnable application scaffold and the approved code, database, test, and documentation directory structure.

The repository now contains a runnable Next.js App Router application with TypeScript, Tailwind CSS and ESLint. The initial page, lint, typecheck and production build have been verified. Browser and server Supabase clients are in place, and the local development project connection passes the minimal server-side health check. Supabase CLI `2.111.0` is project-locked, and the empty timestamped migration baseline passes local reset, lint and schema-drift checks.

New-member setup is now documented from prerequisites and cloning through environment configuration,
local health verification and production build. The independent clean-install replay remains Day 4
step 9 and is not yet counted as complete.

The GitHub repository is now owned by `Josscui516`, and Vercel Production is connected to `main` at [mahjong-flow.vercel.app](https://mahjong-flow.vercel.app). A fresh Production deployment and a protected Preview deployment both reached `Ready`; their root pages and `/api/health/supabase` endpoints returned HTTP `200`. Preview temporarily shares the existing Supabase project and receives only the public URL and publishable key. This strategy is limited to fictional data and non-destructive testing; see the [Day 4 step 7 audit](docs/plans/week-1/artifacts/day-4/DAY_4_STEP_7_VERCEL_ENVIRONMENT_AUDIT.md).

## Technology

| Area | Baseline |
|---|---|
| Application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS v4 |
| Database and authentication | Supabase PostgreSQL and Auth |
| Authorisation | Server-side checks and Supabase RLS |
| Deployment | Vercel and Supabase |
| Collaboration | GitHub Issues, Projects, and Pull Requests |

The initial lockfile fixes Next.js `16.3.0`, React `19.2.8` and the compatible toolchain. Development uses Node.js `24.x` and npm `11.16.0`.

## Prerequisites

Before setting up the repository, obtain:

- Git and a GitHub account with read access to `Josscui516/MahjongFlow`;
- Node.js `24.x` (the current verified version is `24.18.0`);
- npm `11.16.0`, selected by the committed `packageManager` field and lockfile;
- access to the MahjongFlow Supabase project to obtain its public project URL and publishable key;
- access to the `mahjong-flow` Vercel project when deployment settings or protected Previews must be inspected;
- Docker Desktop only when running the optional local Supabase database workflow.

Next.js 16 requires Node.js `20.9.0` or newer, but this repository deliberately standardises on
Node.js `24.x`. Use the committed `.nvmrc` where supported and do not introduce another package
manager or lockfile.

## Install and configure

Clone the repository and install the exact dependency versions from `package-lock.json`:

```bash
git clone https://github.com/Josscui516/MahjongFlow.git
cd MahjongFlow
npm ci
```

Create a personal local environment file from the safe variable contract:

```bash
cp .env.example .env.local
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env.local
```

Fill only the two required public variables in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Obtain both values from the Supabase project **Connect** dialog or **Project Settings → API Keys**.
Leave `SUPABASE_SECRET_KEY` empty unless a reviewed server-only workflow explicitly requires it.
Never copy environment values into documentation, chat, Issues, Pull Requests, screenshots, shell
history or committed files.

## Run and verify

Start the development server:

```bash
npm run dev
```

Open <http://localhost:3000>. Then verify the database-free Supabase reachability endpoint:

```bash
curl --fail http://localhost:3000/api/health/supabase
```

PowerShell equivalent:

```powershell
Invoke-RestMethod http://localhost:3000/api/health/supabase
```

A configured and reachable project returns only:

```json
{
  "service": "supabase",
  "status": "ok"
}
```

Before handing work to another team member, run the baseline checks:

```bash
npm run lint
npm exec tsc -- --noEmit
npm run build
```

The health endpoint proves only that the configured Supabase Auth service is reachable. It does not
validate business tables, migrations, RLS policies or authenticated sessions.

## Optional local database workflow

The normal application setup uses the hosted development project and does not require Docker.
Database migration work additionally requires Docker Desktop:

```bash
npm run db:start
npm run db:reset:no-seed
npm run db:migrations
npm run db:lint
npm run db:diff
npm run db:stop
```

These commands target the local database. Do not run remote push, reset, repair or restore commands
without explicit environment verification and authorisation. See the
[database migration operations guide](docs/operations/DATABASE_MIGRATIONS.md).

## Supabase and Vercel configuration

| Service | Configuration entry | Current boundary |
|---|---|---|
| Supabase application values | Project **Connect** dialog or **Project Settings → API Keys** | Use only the project URL and publishable key for ordinary clients |
| Supabase repository integration | **Project Settings → Integrations → GitHub** | Repository root `.`; production branch `main` |
| Supabase Vercel integration | **Project Settings → Integrations → Vercel** | Production sync enabled; full Preview and Development sync disabled |
| Vercel Git connection | Project **Settings → Git** | `Josscui516/MahjongFlow`; Production branch `main` |
| Vercel variables | Project **Settings → Environment Variables** | Review Production, Preview and Development scopes separately |
| Vercel deployments | Project **Deployments** | Production is public; Preview remains protected |

Production is available at <https://mahjong-flow.vercel.app>. Preview currently shares the same
Supabase project using only the public URL and publishable key. Use fictional data and non-destructive
checks in Preview; do not add service-role keys or database credentials.

## Troubleshooting

| Symptom | Check |
|---|---|
| `npm ci` rejects the runtime | Confirm `node --version` is `24.x` and `npm --version` is `11.16.0` |
| Development server reports missing Supabase configuration | Confirm both required names exist in `.env.local`, then restart `npm run dev` |
| Health endpoint returns HTTP `503` | Check project status, network access, variable names and whether the URL/key belong to the same project |
| Port `3000` is busy | Use the alternate URL printed by Next.js or stop the conflicting local process |
| Preview redirects to sign-in | Use an authorised Vercel account; Preview authentication is intentional |
| App health succeeds but database access fails | Check migrations, Data API exposure, grants, RLS and policies; never bypass the problem with a secret key |

## Local environment

The repository includes `.env.example` as the safe variable contract and an ignored `.env.local`
for developer-specific values. The required Supabase development URL and publishable key have been
configured locally and validated without printing their values.

After starting the development server, `GET /api/health/supabase` performs a database-free
reachability check and returns only a minimal service status. See the
[step 5 connection record](docs/plans/week-1/artifacts/day-4/DAY_4_STEP_5_SUPABASE_CONNECTION.md)
for its security boundary and troubleshooting notes.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Supabase development project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | Publishable key protected by database RLS |
| `SUPABASE_SECRET_KEY` | Server only; optional | Narrow approved operations that must bypass RLS |

Obtain project values from the Supabase project's API settings after the development project is
created. Never put the secret key in a `NEXT_PUBLIC_` variable, Client Component, log, screenshot,
Issue, Pull Request or committed file. See the [environment configuration guide](docs/operations/ENVIRONMENT_CONFIGURATION.md).

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
| [Week 1 plan](docs/plans/week-1/WEEK_1_IMPLEMENTATION_PLAN.md) | Five-day preparation and setup plan |
| [P0 backlog](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_3_P0_PRODUCT_BACKLOG.md) | Epics, Issues, acceptance conditions, and dependencies |
| [Database ERD](docs/plans/week-1/artifacts/day-3/DAY_3_STEP_3_DATABASE_ERD.md) | Entities and core business relationships |
| [Permission matrix](docs/plans/week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md) | Role permissions and enforcement points |
| [Day 3 final review](docs/plans/week-1/artifacts/day-3/DAY_3_STEP_8_CROSS_DOCUMENT_REVIEW.md) | Data, privacy, UX, and Day 4 readiness review |
| [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md) | Branch, review, testing, and merge rules |
| [Database migration operations](docs/operations/DATABASE_MIGRATIONS.md) | Local Supabase start, migration, reset, lint, diff and rollback rules |
| [Vercel deployment operations](docs/operations/VERCEL_DEPLOYMENT.md) | Production, Preview, environment scope and verification rules |
| [Environment configuration](docs/operations/ENVIRONMENT_CONFIGURATION.md) | Variable scope, acquisition and secret-handling rules |

## Contributing

```text
Issue → short-lived branch → Pull Request → non-author review → Testing → merge
```

Do not commit directly to `main`. Every branch and Pull Request must reference a real Issue. Database or permission changes require migrations and role-specific tests. See the [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md).

## Team

FIT3161 Team S1_CS_01: Joshua Xingjian Cui, Li Zhang, Shiying Liao, Xuanwei Xu, and Yubo Cai.

## Licence

This academic project has no open-source licence and may not be copied, redistributed, or reused without permission.
