# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Day 2 product and UX baseline complete; application scaffold not yet created

**Project board:** [MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)

## What MahjongFlow does

MahjongFlow connects the club's core operational workflow:

```text
Meeting → Decision → Task → Event preparation → Registration → Check-in → Dinner verification → Dashboard
```

The MVP focuses on:

- committee authentication with predefined committee and authorised roles;
- meeting records, discussion points, decisions, and decision-to-task traceability;
- task ownership, deadlines, status, filtering, overdue calculation, and dashboard summaries;
- weekly session and tournament management with related preparation tasks;
- authorised back-office participant registration;
- activity-specific QR check-in with time-window and duplicate protection;
- attendance-based dinner eligibility available only to authorised users.

The approved scope and exclusions are defined in the [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md) and [Day 1 scope boundary](docs/plans/week-1/artifacts/day-1/DAY_1_SCOPE_BOUNDARIES_AND_CHANGE_CONTROL.md).

## Current status

Day 1 established the approved MVP scope and technical baseline. Day 2 converted that scope into a prioritised Product Backlog, information architecture, core user flows, and low-fidelity wireframes. The Day 2 review confirmed traceability for all 48 P0 and mandatory privacy requirement IDs.

The GitHub Project currently contains 8 epics and 29 implementation Issues. All 29 implementation Issues have an initial assignee, but remain in `Backlog` until the data, permission, and environment readiness gates are complete.

Next: [Day 3 — Database, permissions, and privacy design](docs/plans/week-1/DAY_3_DATA_SECURITY_AND_PRIVACY.md).

The repository still contains documentation only; there is no runnable Next.js application or verified installation command yet. Application setup, exact dependency versions, `.env.example`, and verified local commands are scheduled for Day 4. Quality tooling and CI are scheduled for Day 5.

## Technology baseline

| Area | Decision |
|---|---|
| Web application | Next.js App Router + TypeScript + React |
| Styling | Tailwind CSS v4 |
| Database and authentication | Supabase PostgreSQL + Supabase Auth |
| Authorisation | Next.js server-side checks + Supabase Row Level Security |
| Deployment | Vercel + Supabase |
| Collaboration | GitHub Pull Requests + GitHub Projects |

Exact compatible package versions will be installed, verified, and locked during Day 4. See the [technology decision record](docs/plans/week-1/artifacts/day-1/DAY_1_TECH_STACK_DECISION.md) for rationale, risks, and security boundaries.

## Repository status and planned structure

Current workspace content:

```text
.
├── docs/project/          # Approved MVP proposal
├── docs/plans/week-1/     # Week 1 plans and artefacts grouped by workday
├── docs/templates/        # Week and day planning templates
├── AGENTS.md              # Repository rules for Codex
├── .gitignore
└── README.md
```

The approved application structure uses `src/app`, `src/features`, `src/components`, `src/lib`, `supabase`, and dedicated test directories. These paths will be created when the project is initialized on Day 4. See the [repository structure baseline](docs/plans/week-1/artifacts/day-1/DAY_1_REPOSITORY_STRUCTURE_BASELINE.md).

## Documentation

| Document | Purpose |
|---|---|
| [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md) | Authoritative product scope, roles, roadmap, and delivery baseline |
| [Week 1 implementation plan](docs/plans/week-1/WEEK_1_IMPLEMENTATION_PLAN.md) | Five-day planning and preparation schedule |
| [Day 1 final review](docs/plans/week-1/artifacts/day-1/DAY_1_FINAL_REVIEW_AND_SIGNOFF.md) | Approved Day 1 results and team sign-off |
| [P0 scope checklist](docs/plans/week-1/artifacts/day-1/DAY_1_P0_SCOPE_CHECKLIST.md) | Atomic P0 requirements and dependencies |
| [Acceptance matrix](docs/plans/week-1/artifacts/day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md) | User-story traceability and testable acceptance scenarios |
| [Day 2 plan](docs/plans/week-1/DAY_2_BACKLOG_AND_UX_FLOW.md) | Product Backlog, information architecture, and UX planning workflow |
| [P0 Product Backlog](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_3_P0_PRODUCT_BACKLOG.md) | Epics, implementation Issues, acceptance conditions, and verification methods |
| [Prioritised Backlog](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_4_PRIORITISED_BACKLOG.md) | Delivery order, dependencies, readiness gates, and target weeks |
| [Page inventory and information architecture](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_5_PAGE_INVENTORY_AND_INFORMATION_ARCHITECTURE.md) | P0 pages, navigation, role visibility, and sensitive areas |
| [Core user flows](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_6_CORE_USER_FLOWS.md) | Success, failure, and access-denied paths for core workflows |
| [Low-fidelity wireframes](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_7_LOW_FIDELITY_WIREFRAMES.md) | Page-level content, actions, states, and role differences |
| [Day 2 traceability review](docs/plans/week-1/artifacts/day-2/DAY_2_STEP_8_TRACEABILITY_AND_DAY_REVIEW.md) | Requirement-to-Issue, page, flow, and wireframe coverage |
| [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md) | Branch, PR, review, WIP, and blocker rules |
| [Codex repository rules](AGENTS.md) | Mandatory instructions for Codex work in this repository |

## Contributing

The team workflow is:

```text
Issue → short-lived branch → Pull Request → non-author review → Testing → merge to main
```

- Every branch must reference a GitHub Issue.
- Team branches use `<type>/<issue-number>-<description>`.
- Codex-created branches use `codex/<issue-number>-<description>`.
- Do not commit directly to `main`.
- At least one non-author reviewer must approve a Pull Request.
- Database or permission changes require a migration, rollback notes, and permission tests.

Follow the full [Git collaboration agreement](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md). Codex must also follow [AGENTS.md](AGENTS.md).

## Security and privacy

- Use only fictional or anonymised participant data during development, testing, and demonstrations.
- Never commit credentials, tokens, real environment values, production configuration, or real participant records.
- Sensitive access must be enforced by both server-side authorisation and Supabase RLS, not by hiding UI controls.
- Supabase secret/service-role keys must never be exposed to browser code.

## Team

FIT3161 Team S1_CS_01: Joshua Xingjian Cui, Li Zhang, Shiying Liao, Xuanwei Xu, and Yubo Cai.

## Licence

This is an academic project. No open-source licence has been selected; the repository must not be copied, redistributed, or reused outside the project without permission.
