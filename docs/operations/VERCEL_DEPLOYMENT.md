# Vercel deployment operations

> Project setup plan: [Day 4: Project setup and environment](../plans/week-1/DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> Environment guide: [Environment configuration](ENVIRONMENT_CONFIGURATION.md)
> Last checked: 2026-08-06

## 1. Current topology

| Component | Current setting | Audit result |
|---|---|---|
| GitHub repository | `Josscui516/MahjongFlow` | Connected |
| Vercel project | `mahjong-flow` | Connected as Next.js |
| Production branch | `main` | Connected |
| Production URL | <https://mahjong-flow.vercel.app> | Root returned HTTP `200` |
| Preview deployment | <https://mahjong-flow-5bl9x7us6-joshuas-projects-e2e6b817.vercel.app> | `Ready`; protected access |
| Supabase Production sync | Enabled | URL and publishable key verified by health check |
| Vercel Preview public variables | URL and publishable key present | Shared Supabase project |
| Supabase full Preview credential sync | Disabled | Avoids service-role and database credentials |
| Supabase Development sync | Disabled | Local `.env.local` remains authoritative |

## 2. Environment boundaries

Vercel Production is built from `main`. Non-production Git branches and Pull Requests create Preview
deployments, while Development variables are intended for local Vercel CLI workflows. Variables are
captured by a deployment when it is built; changing a project variable does not update an existing
deployment. Trigger a new deployment after adding or rotating variables.

The application requires `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These names are present in Production. Values must remain
hidden and must never be copied into documentation, logs, Issues or Pull Requests. `SUPABASE_SECRET_KEY`,
service-role keys and database credentials are server-only and should not be added to Preview unless an
approved server operation explicitly requires them.

## 3. Production verification

1. Trigger a new Production deployment from the current `main` after the Supabase variable sync;
2. confirm the deployment reaches `Ready` and is sourced from the expected commit;
3. open `/` and expect HTTP `200`;
4. request `/api/health/supabase` and expect HTTP `200` with only the minimal service status;
5. inspect logs for configuration failures without printing environment values;
6. if health remains HTTP `503`, verify variable scope and names, then redeploy again after corrections.

The initial 2026-08-06 deployment returned HTTP `503` from the health endpoint. A fresh Production
deployment using the latest project settings reached `Ready`; `/` and `/api/health/supabase` then
returned HTTP `200`. Build-error checks were clean and no runtime error clusters were found in the
following one-hour verification window.

## 4. Preview strategy

The current Supabase Free project does not provide database branching. The available approaches are:

1. preferred: use a separate fictional-data Supabase development／preview project and scope only its
   public URL and publishable key to Vercel Preview;
2. temporary shared project: explicitly accept that Preview and Production use the same database,
   scope only the required public variables, and prohibit destructive or real-data testing.

For the Day 4 baseline, the user explicitly approved the temporary shared-project approach. The
Vercel Preview scope contains `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; service-role and database credentials were not added.
Supabase's full Preview sync remains disabled because its confirmation explicitly includes those
high-privilege credentials. A direct Preview deployment from the verified source reached `Ready`.
Authenticated checks returned HTTP `200` from both `/` and `/api/health/supabase`.

The Preview deployment is protected by Vercel Authentication. Anonymous requests redirect to sign-in;
team members must use an authorised Vercel session or a short-lived share link. This protection should
remain enabled. Future Git branches and Pull Requests should still verify their own generated Preview
deployments before merge.

## 5. Git safety

Both Vercel and Supabase monitor `main`. Protect `main` before Week 2 with required Pull Requests,
non-author approval, no force pushes or deletion, and required CI checks when available. Never use a
direct push merely to test deployment automation.

## 6. References

- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel deployment environments](https://vercel.com/docs/deployments/environments)
- [Supabase Vercel integration](https://supabase.com/docs/guides/integrations/vercel-marketplace)
- [Supabase GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration)

## 7. 当前 Production 交付记录（2026-09-30）

2026-09-30 实时复核：成员 PR [#95](https://github.com/Josscui516/MahjongFlow/pull/95) 已合入 `sprint/8-mvp-internal-acceptance`，Sprint 总 PR [#96](https://github.com/Josscui516/MahjongFlow/pull/96) 已合入 `main`，SHA `7e0c614b8a2f6e2bec06ab4df82cc2641858cdaa`。main 的 [Quality run 36673253441](https://github.com/Josscui516/MahjongFlow/actions/runs/36673253441) 五项全部成功；同 SHA 的 Vercel Production deployment `6752199649` 状态为 success。#94／#29 已关闭，Project 均 Done／Passed。非作者 PR 批准采用 Joshua 已明确授权的单次例外，未虚构 approval。

本轮读取 GitHub deployment／status 记录，不重审 Vercel settings 或环境变量，不创建新部署；旧 Preview URL／配置表保留为 2026-08-06 审计快照。正式演示启动、干净配置、交接和回退演练仍属于 S10／M6，不能由平台 success 状态替代。

## 8. Vercel 构建兼容修复与最新生产部署（2026-10-20）

最新 `main` 提交 `e0ac9eaaf280da684d785c720f5ccf59d1dcaa17` 的首次生产构建在 Vercel `onBuildComplete` 阶段失败，错误为缺少 `.next/next-server.js.nft.json`。默认 Turbopack 构建虽完成编译和类型检查，但未满足该适配器的追踪文件要求。

本次将 Vercel 项目 `mahjong-flow` 的 Build Command 设置为 `npm run build -- --webpack`，并重新部署相同提交。该设置保存在 Vercel 项目中；仓库默认构建命令及本地 Docker 配置保持原样。Linux Docker 验证该命令构建成功，且生成 `.next/next-server.js.nft.json` 与 `.next/standalone/server.js`。日后更换项目或恢复默认构建器时，须重新验证 Vercel 收尾阶段，不能仅凭本地 `next build` 成功判断可发布。

生产部署 `dpl_BYX1nTLG4Fq78F8u5hYuM56XEpfa` 已达到 `READY`，正式域名 `mahjong-flow.vercel.app` 已绑定此部署；部署来源 SHA 与实时远程 `main` 完全一致。线上 `/login` 返回 HTTP `200`，`/api/health/supabase` 返回 HTTP `200` 和 `status: ok`。同 SHA 的 GitHub Quality run `39369844274` 全部通过。

线上 Supabase migration history 已包含仓库全部 20 个迁移，最后一个版本为 `20261020014659`；本次未执行远程 migration、seed 或 reset。验证覆盖部署版本、公开登录页、数据库连通性与迁移记录，未使用真实参与者数据，也未执行线上业务写入验收。

如需回退应用，可恢复此前已验证的生产部署；不要通过重置数据库回退。恢复原默认 Build Command 前应先解决并验证 Turbopack 与 Vercel 适配器的兼容性，否则会再次出现相同构建错误。
