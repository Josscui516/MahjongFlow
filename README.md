# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

**Course:** FIT3161 Computer Science Project  
**Team:** S1_CS_01  
**Stage:** Planning baseline complete; application scaffold not yet created

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

Day 1 scope and technical baseline work was approved on 3 August 2026. The repository currently contains project documentation only; there is no runnable Next.js application or verified installation command yet.

Next: [Day 2 — Backlog, information architecture, and UX flow](docs/plans/week-1/DAY_2_BACKLOG_AND_UX_FLOW.md).

Application setup, exact dependency versions, `.env.example`, and verified local commands are scheduled for Day 4. Quality tooling and CI are scheduled for Day 5.

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
| [Week 1 artefact index](docs/plans/week-1/artifacts/README.md) | Implementation outputs grouped by workday |
| [Day 1 final review](docs/plans/week-1/artifacts/day-1/DAY_1_FINAL_REVIEW_AND_SIGNOFF.md) | Approved Day 1 results and team sign-off |
| [P0 scope checklist](docs/plans/week-1/artifacts/day-1/DAY_1_P0_SCOPE_CHECKLIST.md) | Atomic P0 requirements and dependencies |
| [Acceptance matrix](docs/plans/week-1/artifacts/day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md) | User-story traceability and testable acceptance scenarios |
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
