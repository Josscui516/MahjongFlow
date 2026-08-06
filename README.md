# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Day 4 scaffold, Supabase connection and local migration baseline verified; Vercel pending
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

The repository now contains a runnable Next.js App Router application with TypeScript, Tailwind CSS and ESLint. The initial page, lint, typecheck and production build have been verified. Browser and server Supabase clients are in place, and the development project connection passes the minimal server-side health check. Supabase CLI `2.111.0` is project-locked, and the empty timestamped migration baseline passes local reset, lint and schema-drift checks. Vercel project creation permission is still pending; see the [Day 4 plan](docs/plans/week-1/DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md).

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

## Contributing

```text
Issue → short-lived branch → Pull Request → non-author review → Testing → merge
```

Do not commit directly to `main`. Every branch and Pull Request must reference a real Issue. Database or permission changes require migrations and role-specific tests. See the [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md).

## Team

FIT3161 Team S1_CS_01: Joshua Xingjian Cui, Li Zhang, Shiying Liao, Xuanwei Xu, and Yubo Cai.

## Licence

This academic project has no open-source licence and may not be copied, redistributed, or reused without permission.
