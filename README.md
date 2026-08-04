# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Day 3 planning baseline complete; application setup begins on Day 4
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

Days 1–3 are complete. The MVP scope, backlog, UX flows, 11-entity data model, permissions, privacy rules, and migration plan have passed review.

The repository is still documentation-only. There is no runnable application or verified installation command yet. [Day 4](docs/plans/week-1/DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md) will create and verify the application scaffold, dependencies, Supabase baseline, environment configuration, and local commands.

## Technology

| Area | Baseline |
|---|---|
| Application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS v4 |
| Database and authentication | Supabase PostgreSQL and Auth |
| Authorisation | Server-side checks and Supabase RLS |
| Deployment | Vercel and Supabase |
| Collaboration | GitHub Issues, Projects, and Pull Requests |

Exact compatible dependency versions will be verified and locked during Day 4.

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

## Contributing

```text
Issue → short-lived branch → Pull Request → non-author review → Testing → merge
```

Do not commit directly to `main`. Every branch and Pull Request must reference a real Issue. Database or permission changes require migrations and role-specific tests. See the [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md).

## Team

FIT3161 Team S1_CS_01: Joshua Xingjian Cui, Li Zhang, Shiying Liao, Xuanwei Xu, and Yubo Cai.

## Licence

This academic project has no open-source licence and may not be copied, redistributed, or reused without permission.
