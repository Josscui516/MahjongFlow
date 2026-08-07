# 第 5 天步骤 7：仓库卫生与安全检查记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 安全依据：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 权限依据：[可实施权限矩阵与控制点](../day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md)
> 测试 Pull Request：[#43 — chore: establish quality CI baseline](https://github.com/Josscui516/MahjongFlow/pull/43)
> 执行日期：2026-08-07（Australia/Sydney）
> 状态：步骤 7 完成；未发现密钥、真实参与者数据或应移除的仓库产物

## 1. 执行结论

已检查当前分支相对 `origin/main` 的全部新增和修改内容，并对整个已跟踪仓库、当前 Git 历史、本地忽略规则、`.env.example`、README、依赖审计和浏览器静态构建输出执行安全复核。

最终候选集合包含 105 个已跟踪文件，其中 PR #43 相对 `main` 修改或新增 14 个文件（包含本记录）。未发现以下内容：

- `.env`、`.env.local`、Supabase 本地环境文件或非空生产配置；
- secret／service-role key、GitHub token、私钥、密码、JWT secret 或 hosted Supabase URL 赋值；
- 真实参与者姓名、邮箱、学号、报名、签到或晚餐资格记录；
- `node_modules`、`.next`、coverage、测试报告、本地平台状态、日志、dump、备份或私钥文件；
- 超过 1 MiB 的已跟踪文件或不明二进制交付物；
- 浏览器静态 bundle 中的 `SUPABASE_SECRET_KEY`、`service_role` 或 `sb_secret_` 内容。

仓库候选内容可以安全共享。PR #43 的四项 required checks 与 Vercel 均通过；用户随后明确批准本次作为例外，无需非作者批准即可合并。该例外已记录在 PR 对话中，PR 已通过 squash merge 进入 `main`，合并提交为 `c5d45d8`。本次例外不修改长期协作规则，后续 PR 仍默认要求非作者审查。

## 2. 文件与忽略规则检查

| 检查 | 方法 | 结果 |
|---|---|---|
| PR 范围 | `git diff --stat origin/main...HEAD`、PR file list | 质量脚本、CI、测试和 Day 5 步骤记录；无业务、数据库或权限实现改动 |
| 工作树 | `git status -sb` | 检查前干净；仅在生成本记录后出现预期文档改动 |
| 空白错误 | `git diff --check origin/main...HEAD` | 通过 |
| 禁止路径 | 检查全部 `git ls-files` | 0 个已跟踪 build、dependency、environment、report、dump 或 key 路径 |
| 当前被忽略却已跟踪 | `git ls-files -ci --exclude-standard` | 0 |
| 大文件 | 检查全部已跟踪文件大小 | 0 个文件超过 1 MiB |
| 本地状态 | `git status --ignored` | `.env.local`、`.next/`、`node_modules/` 均为 ignored |

`.gitignore` 已明确覆盖 `.env.local`、`.next/`、`node_modules/`、`.vercel/`、`.supabase/` 和 `coverage/`。本地存在的 `.env.local`、构建输出和依赖目录均未读取内容、未暂存、未提交。

## 3. 环境与密钥检查

已跟踪的环境文件只有 `.env.example`。其中共有三个变量赋值，值均为空：

| 变量 | 值状态 | 允许范围 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 空 | 仅记录浏览器可见变量名 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 空 | 仅记录浏览器可见变量名 |
| `SUPABASE_SECRET_KEY` | 空 | 仅记录 server-only 可选变量名 |

对当前全部已跟踪文本和 Git patch 历史执行了以下值级模式检查：

- private-key header；
- GitHub classic／fine-grained token 前缀；
- Supabase `sb_secret_` 前缀；
- 非空 `SUPABASE_SECRET_KEY`／service-role／database password／Vercel token 赋值；
- hosted Supabase URL 赋值；
- secret 字段中的 JWT 形态值。

最终结果均为 0。首次历史扫描曾报告 1 个候选项；复核发现原因是正则中的空白匹配跨越了 `.env.example` 的空值换行。将规则收紧为只允许同一行的空格／制表符后候选数为 0，没有隐藏或删除真实发现。

## 4. 个人资料检查

| 检查 | 结果 |
|---|---|
| 已赋值 student ID | 0 |
| 非示例参与者邮箱 | 0 |
| 真实参与者 fixture／seed | 0 |
| 报名、签到、资格明细 | 0 |

文本扫描发现的邮箱只属于两类安全内容：

1. Day 3 隐私与 seed 计划中的 `example.test` 虚构域名；
2. `supabase/config.toml` 中被注释的上游示例管理员邮箱，两处均为通用示例形式，不是运行配置或参与者资料。

团队成员姓名出现在项目团队、负责人和交付文档中，不属于被禁止提交的参与者报名／签到数据；没有把团队信息误报为参与者泄露。

## 5. README 与构建输出检查

- README 的环境说明只列变量名和获取流程，没有真实 URL value、key、token、密码、session 或参与者记录；
- README 中公开的 Vercel 应用 URL 是已批准的部署入口链接，不是可用于认证或连接数据库的生产 secret/config value；
- `.next/static` 中没有发现 `SUPABASE_SECRET_KEY`、`service_role` 或 `sb_secret_`；
- CI workflow 只提供 localhost URL 和明确标记为 fictional 的无效 publishable key；
- CI 和 smoke test 不读取 `.env.local`，也不访问生产参与者数据。

## 6. 依赖与最终复验

| 检查 | 结果 |
|---|---|
| `npm audit --audit-level=high` | 通过；0 vulnerabilities |
| `npm run lint` | 步骤 6 最终 head 与本地均通过 |
| `npm run typecheck` | 步骤 6 最终 head 与本地均通过 |
| `npm test` | 步骤 6 最终 head 与本地均通过；1 file、1 test |
| `npm run build` | 步骤 6 最终 head 与本地均通过 |
| 合并后 `main` Quality | [run 31147325516](https://github.com/Josscui516/MahjongFlow/actions/runs/31147325516)；Lint、Typecheck、Test、Build 全部通过 |
| Vercel Production | commit `c5d45d8`，状态 `READY`；根页面与 Supabase health 均为 HTTP `200` |
| Vercel runtime errors | 合并后 1 小时窗口为 0 |
| Markdown 相对链接 | 步骤 7 记录加入后再次检查 |
| secret／PII／禁止路径扫描 | 步骤 7 记录加入后再次检查 |

已知的 `unrs-resolver@1.12.2` allow-scripts 审批提示仍由 D5-OI-07 跟踪；它不是已执行的未知脚本、审计漏洞或本步骤发现的密钥问题。

## 7. 步骤 7 完成检查

- [x] 已查看全部新增和修改文件；
- [x] 已检查本地环境文件、密钥、token 和生产配置；
- [x] 已检查真实姓名、邮箱、学号和签到资料；
- [x] 已检查构建输出、依赖目录和临时文件是否被跟踪；
- [x] `.env.example` 只包含变量名、空占位值和安全说明；
- [x] README 不暴露敏感信息；
- [x] 已复核初始扫描候选项，没有把误报静默当作通过；
- [x] 当前未发现需要修改的应用、环境或安全配置问题；
- [x] 仓库候选内容可安全共享；PR #43 已按用户明确批准的单次审查例外合并，例外已留痕。

步骤 7 完成。下一步应执行 Day 5 步骤 8“周级交付物验收”。
