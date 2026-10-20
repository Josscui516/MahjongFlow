# MahjongFlow

> A lightweight meeting, task, event, and attendance coordination system for the Monash Mahjong Club.

> 2026-10-18 晚餐功能：`/dinner-roster` 维护所有活动共用的持续资格，活动晚餐页显示本场可领取人员并保存已发放状态；见[当前需求与部署](docs/project/DINNER_CHECK_IN_EMAIL_MATCHING.md)。

> 2026-10-16 晚餐规则修复：内部名册保留独立预录，核验页只显示有效报名、已确认签到且邮箱匹配的人员。部署前须应用新增 migration，见[需求与部署记录](docs/project/DINNER_CHECK_IN_EMAIL_MATCHING.md)。下方 2026-09-30 状态为历史基线。

- **Course:** FIT3162 Computer Science Project
- **Team:** S1_CS_01
- **Stage:** Sprint 8 merged into `main`; M5 complete; S10/M6 formal handoff pending
- **Project board:** [MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)

## Overview

MahjongFlow connects the club's coordination workflow:

```text
Meeting → Decision → Task → Event → Registration → Check-in → Dinner verification
```

As of 2026-09-30, `main` includes:

- `committee` and `authorised` roles, account management, server-side authorisation, Supabase RLS, and protected navigation;
- meetings, discussion points, decisions, and task conversion that preserves source references;
- task assignees, Sydney-based due dates, statuses, Dashboard follow-up, and event preparation tasks;
- authorised registration management, event-specific revocable QR links, manual check-in, duplicate-submission protection, and audited attendance corrections;
- dinner eligibility derived from valid attendance, with ordinary committee users restricted to safe aggregates;
- fictional fixtures, timestamped migrations, permission and concurrency regression tests, and integrated acceptance infrastructure.

See the [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md) for approved scope and exclusions. Passing engineering tests does not establish target-user usability, independent review, or final delivery approval.

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

Verified on 2026-09-30: work-package PR [#95](https://github.com/Josscui516/MahjongFlow/pull/95) merged into `sprint/8-mvp-internal-acceptance`, and Sprint integration PR [#96](https://github.com/Josscui516/MahjongFlow/pull/96) merged into `main` at SHA `7e0c614b8a2f6e2bec06ab4df82cc2641858cdaa`. All five jobs in main's [Quality run 36673253441](https://github.com/Josscui516/MahjongFlow/actions/runs/36673253441) succeeded; Vercel Production deployment `6752199649` for the same SHA also recorded success. Issues #94 and #29 are closed and marked Done/Passed in the Project. Non-author PR approval was waived under a one-time exception explicitly authorised by Joshua; no approval event was fabricated.

Joshua confirmed M5 complete and retains the target-user walkthrough and internal review material. The five historical Sprint 3 acceptance gates were updated to Passed following Joshua's individual confirmation. S10/M6, the production data retention policy, scope reconciliation for #62–#65, and outstanding aggregate acceptance gates remain tracked separately. See the [current project status](docs/project/CURRENT_PROJECT_STATUS.md) for the complete record and the [documentation index](docs/DOCUMENTATION_INDEX.md) for all documents.

Production demo: [mahjong-flow.vercel.app](https://mahjong-flow.vercel.app). The documentation update did not trigger a new deployment or modify production data.

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

后台首页统一为 `/dashboard`：登录后的任务跟进、近期活动和快捷操作集中在同一页，品牌链接也返回该页。旧 `/backoffice` 书签会跳转到 Dashboard，不再展示独立的 Committee dashboard。

Task 创建和编辑支持关联多场 Meeting；会议详情显示全部关联任务，原始决策／讨论点来源独立保留。数据关系、迁移和回退见[Task 与 Meeting 关联](docs/project/TASK_MEETING_ASSOCIATIONS.md)。

### 已配置的本地 Docker 环境

前端现在作为 `mahjongflow-frontend` 与现有本地 Supabase 容器一起运行。完成配置后，启动 Docker Desktop 即可自动恢复完整本地服务。访问 http://localhost:3000，无需另外启动 `npm run dev`。现有数据库卷和账号保留。

需要主动启动服务或更换网络后重新检测局域网 IP 时，在仓库目录的 Windows PowerShell 运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
```

修改应用代码后，增加 `-Build` 重建前端镜像：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1 -Build
```

脚本使用现有 `supabase_network_MahjongFlow` 和本地 Supabase CLI；数据库不存在时明确拒绝创建或重置。脚本私下生成被忽略的 `compose.local.env`，不要提交或分享该文件。浏览器通过当前 origin 的 `/supabase` 请求 API，服务端通过 Docker 内部网关访问。Docker 二维码使用启动脚本识别的宿主机局域网地址；正式托管部署继续使用配置的可信 HTTPS 应用 origin。

扫码报名及管理员独立维护的晚餐名册规则见[需求纠正](docs/project/REGISTRATION_AND_DINNER_CORRECTION.md)。本轮提交与验证范围见[补丁交付记录](docs/project/POST_SPRINT_PATCH_DELIVERY.md)。

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
by `supabase status`. Leave `SUPABASE_SECRET_KEY` empty for coordination-only local use. The integrated account-management and QR check-in paths require approved server-only configuration, as described below. After completing the local
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
npm run typecheck
npm run build
```

Detailed setup, troubleshooting and platform procedures live in the
[environment](docs/operations/ENVIRONMENT_CONFIGURATION.md),
[database](docs/operations/DATABASE_MIGRATIONS.md), and
[deployment](docs/operations/VERCEL_DEPLOYMENT.md) guides.

### Server-side configuration for the complete MVP

Account management, event token management, and public check-in read the server-only `SUPABASE_SECRET_KEY` and `APP_BASE_URL` variables. Setting only the two public variables is insufficient to verify these complete workflows. Configure the selected local or demo environment through private channels; keep values in ignored files or platform settings, and never copy them into chat or documentation. See the [environment configuration guide](docs/operations/ENVIRONMENT_CONFIGURATION.md). Leave these management paths disabled when only health checks and ordinary coordination features are needed.

## Security essentials

- Use only fictional or anonymised participant data in development, tests, documentation, and demonstrations.
- Never commit credentials, tokens, real environment values, or real participant records.
- Enforce sensitive access in both server-side code and Supabase RLS; hiding UI is not authorisation.
- Committee users may see aggregate attendance counts, but participant details require the `authorised` role.
- Store check-in token digests only, keep secret keys server-side, and apply database changes through timestamped migrations.

## Key documentation

| Document | Purpose |
|---|---|
| [Current project status](docs/project/CURRENT_PROJECT_STATUS.md) | Sprint 8, CI and deployment evidence, Board status, and remaining M6 gates |
| [Complete documentation index](docs/DOCUMENTATION_INDEX.md) | Current guides, historical plans, acceptance records, and module documentation |
| [Development Week 8 plan](docs/plans/week-8/WEEK_8_IMPLEMENTATION_PLAN.md) | Completed M5 and #29 delivery, with remaining handoff boundaries |
| [MVP project proposal](docs/project/MVP_PROJECT_PROPOSAL.md) | Authoritative scope, roles, roadmap, and acceptance baseline |
| [Backlog and sprint management](docs/product/BACKLOG_AND_SPRINT_MANAGEMENT.md) | Product Backlog, Current Sprint, Kanban, fields, and canonical User Stories |
| [Week 1 plan](docs/plans/week-1/WEEK_1_IMPLEMENTATION_PLAN.md) | Five-day preparation and setup plan |
| [Sprint 2 acceptance record](docs/plans/week-2/M1_ACCEPTANCE_RECORD.md) | Authentication, role, database, shared UI, and quality-gate evidence |
| [Sprint 3 implementation plan](docs/plans/week-3/WEEK_3_IMPLEMENTATION_PLAN.md) | Meeting work packages, integration contracts, and remaining Sprint acceptance |
| [Course Week 6 / Development Week 5 plan](docs/plans/week-5/WEEK_5_IMPLEMENTATION_PLAN.md) | Sprint 5: four members implement task follow-up, with Joshua handling integration and acceptance; includes five individual plans |
| [Course Week 7 / Development Week 6 plan](docs/plans/week-6/WEEK_6_IMPLEMENTATION_PLAN.md) | Sprint 6: events, registration, and real event queries; includes five individual plans |
| [Course Week 8 / Development Week 7 plan](docs/plans/week-7/WEEK_7_IMPLEMENTATION_PLAN.md) | Sprint 7: four members implement QR check-in and dinner verification, with Joshua handling integration and acceptance; includes five individual plans |
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
