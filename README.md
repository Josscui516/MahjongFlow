# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Week 1 accepted with recorded reservations; Week 2 foundation work is ready
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

Week 1 has established the approved scope, backlog, interface and data design, runnable application
scaffold, Supabase connection, migration baseline, Production and protected Preview deployments,
quality CI, and new-member setup guide. Local and deployed health checks pass, and all six Sprint 2
items are `Ready`; #10 remains a coordination Enabler rather than a sixth personal work package.

Production: [mahjong-flow.vercel.app](https://mahjong-flow.vercel.app)

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
- access to the MahjongFlow Supabase project for its public URL and publishable key;
- Docker Desktop only for local database work;
- Vercel project access only for deployment administration.

Use the committed `.nvmrc`, npm and `package-lock.json`; do not add another package manager or
lockfile.

## Quick start

```bash
git clone https://github.com/Josscui516/MahjongFlow.git
cd MahjongFlow
npm ci
cp .env.example .env.local
```

On PowerShell, use `Copy-Item .env.example .env.local`. Add the following public project values
from Supabase **Connect** or **Project Settings → API Keys**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Leave `SUPABASE_SECRET_KEY` empty unless a reviewed server-only workflow requires it. Then start
the application:

```bash
npm run dev
```

Open <http://localhost:3000> and verify Supabase reachability:

```bash
curl --fail http://localhost:3000/api/health/supabase
```

PowerShell equivalent: `Invoke-RestMethod http://localhost:3000/api/health/supabase`.
The expected status is `ok`. Run the baseline checks before handoff:

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
