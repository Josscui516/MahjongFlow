# Sprint 6 真实浏览器验收

这些脚本操作真实本地应用，不使用页面 fixture 或网络 mock。仅使用专用、可重建的本地 Supabase 项目 `mahjongflow-sprint6-acceptance`，应用固定为 `http://127.0.0.1:4336`。不要用于共享、远程或生产环境。

准备隔离 workdir，将仓库 `supabase/config.toml` 复制并把 project_id 改为上述名称，连接当前 migrations/tests/seed.sql。执行带 seed 的本地 reset，启动 Auth、PostgREST、Kong 和数据库。将 `supabase status -o json` 输出保存到该隔离目录 `status.json`，不要提交。应用的忽略文件 `.env.local` 使用该本地 API URL 与匿名 key，生产构建后启动端口 4336。

PowerShell 中设置 `S6_RUNTIME_DIR` 为隔离目录绝对路径；设置 `S6_PLAYWRIGHT_MODULE` 为已安装 Playwright 的模块路径，或安装 Playwright 后使用默认模块解析。浏览器默认使用 Chrome；本机只有 Edge 时设置 `S6_BROWSER_CHANNEL=msedge`。

生产构建与 `next dev --webpack` 应分别重放浏览器流程。两种模式均检查 `pageerror`、控制台 error/warning；开发模式用于补充 hydration、重复 key 等诊断。仅“不抛异常”不能作为浏览器无错误的证据。无效活动 URL 场景只允许该确切地址预期的资源 404，应用错误及其他地址的错误仍会失败。

截图使用 `caret: 'initial'`，保留页面原有光标样式。默认隐藏光标会向输入框临时注入内联样式，在流式页面仍在 hydration 时可能制造测试工具自身的属性不匹配；不要通过关闭控制台检查规避此类问题。

```powershell
node tests/integration/sprint6/provision.cjs
node tests/integration/sprint6/browser.cjs
node tests/integration/sprint6/registration-browser.cjs
node tests/integration/sprint6/refresh-browser.cjs
node tests/integration/sprint6/event-invariants.cjs
```

按顺序执行，任一步非零退出都视为失败。`provision.cjs` 生成两类虚构账号及随机密码，保存到隔离目录 `accounts.json`；浏览器阶段写入 `ids.json` 和 `evidence/`。该目录必须在 Git 仓库之外，凭据和 status.json 不能复制到证据目录。

脚本内包含验收日固定日期（2026-09-10，活动在 10 月），重放须保留日期边界或整体移动到新的未来日期。全新 seed 中近期活动随 reset 时间计算。多次运行会新增虚构活动/任务，建议重新 reset 并 provision 后重跑，避免默认候选列表分页影响测试。

`registration-browser.cjs` 只清理当前浏览器 fixture 活动的报名/签到，以及固定虚构测试邮箱在 seed 锦标赛中的报名，再插入一条人工签到 fixture。使用固定隔离容器，禁止修改容器名指向实际项目。该步骤验证计数独立，不代表签到 UI 已完成。

运行结果见 `docs/plans/week-6/EVENTS_REGISTRATION_ACCEPTANCE_RECORD.md`。截图需人工确认业务内容已显示；流式 loading 状态不能充当已完成页面的证据。
