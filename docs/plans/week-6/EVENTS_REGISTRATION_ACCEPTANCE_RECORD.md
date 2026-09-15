# Sprint 6 活动、报名与跨页集成验收

执行日期：2026-09-10（Australia/Sydney）。执行人：Yubo / Codex；用户已将 Sprint 6 集成、测试与合并工作交给 Yubo。本记录是技术验收证据，不代替非作者审查、Project 人工确认或 main 合并。

## 候选版本与依赖

- 验收分支：`codex/5-sprint6-acceptance`；主要 Issue：#5；目标：`sprint/6-events-registration`。
- Sprint 6 基线：`74ce81b62857dc1d8249466a7bfeab0e026df673`，已包括成员 PR #73、#74、#75、#77、#79、#80。
- 完整 T-05/T-06 使用真实任务筛选、Dashboard、提醒组件。候选分支纳入 Sprint 5 `c8991ada5cc2dcb0f1fd4cd39279cd92587688c0`、PR #78 `48951733f2767199ca67ba30bc1506df908c54f3`、PR #72 `9ebc94fc20ea5993180aae1fcd7987d51fb3c589`。后两项官方 PR 仍打开；本次组合不代表 Sprint 5 已验收或关闭。
- 本轮无新增 migration、无生成类型修改、无远程数据库写入。原工作目录及用户未提交文件保持原状。

## 结果与覆盖

| 验收范围 | 实测证据 | 结果 |
|---|---|---|
| E-01/02/03 | Chrome 创建周常活动与要求学号的锦标赛，重载；空字段不落库；类型、状态、日期及描述校验自动测试 | 通过 |
| E-04/05 | 真实任务关联显示 0/0、2/3；解除后 1/2，任务仍保留；任务状态修改后 2/2，编辑器关联后 3/3；活动日期/地点更新保留 3 个任务、1 条报名、1 条签到关联 | 通过 |
| E-06、完整 T-06 | Dashboard 使用真实 Supabase 查询；过去、取消/完成活动排除，近期活动按时间/ID稳定排序；当前时刻边界与空/错结果由自动测试补充 | 通过 |
| 完整 T-05 | 真实活动下拉选项、服务端任务筛选得到 3/3；任务编辑后返回已访问的 Dashboard，已完成任务从未完成列表移除，筹备同步更新 | 通过 |
| R-01/02/06 | 真实无学号报名；要求学号时拒绝缺失并在补齐后成功；身份规范化、排除字段、最小 DTO 及约束自动测试 | 通过 |
| R-03 | 浏览器重复提交维持一行；取消/恢复维持一行；数据库并发登记与 RLS 测试 | 通过 |
| R-04/05 | 后台报名隐私时间为 null，不自动产生签到；单独插入虚构人工签到后取消报名，界面报名 0 / 签到 1 | 通过 |
| E-07、R-08 | 匿名活动 URL 跳转登录；committee 可读筹备，名单页面拒绝；committee/匿名直接 REST 无参与者数据；committee 仅获得独立聚合数字；服务端/RLS 自动矩阵 | 通过 |
| 响应式与反馈 | 1280px 桌面、360px 手机；活动/报名/筹备/Dashboard 实际页面；菜单导航；成功、空、校验错误、权限拒绝、404；无横向溢出或浏览器 pageerror | 通过 |

真实浏览器共 24 个场景，直接使用生产构建、真实登录 Cookie、Auth、PostgREST 与数据库，未拦截接口、未替换页面。人工签到仅作为独立数据库 fixture，并非声明 Sprint 7 签到 UI 已交付。R-07/#29、晚餐核验以及远程部署不属于本轮交付。

## 全量质量结果

| 检查 | 命令/方式 | 结果 |
|---|---|---|
| 应用与脚本测试 | `npm test` | 97 suites / 567 tests + 5 script tests 通过 |
| 专项验收 | `npm run test:acceptance` | 21 suites / 148 tests 通过；属于应用测试子集，不重复计总数 |
| 静态质量 | `npm run lint`、`npm run typecheck` | 通过 |
| 生产构建 | `node node_modules/next/dist/bin/next build --webpack` | 通过；Windows 依赖 junction 使用 webpack |
| 数据库重建 | `supabase db reset --local --no-seed`，随后带 seed reset，均指定隔离 workdir | 通过 |
| 数据库断言 | 全部 11 个 SQL 文件递归传入 `supabase test db` | 349 项通过 |
| 并发约束 | 两个仓库 PowerShell runner，指定隔离容器 | 报名 18 项 + RLS 9 项通过 |
| Schema | `db lint --local --fail-on error`、`db diff --local`、`migration list --local` | 无 schema 错误、无漂移、10 个 migration 顺序一致 |
| 恢复演练 | 本地 `pg_dump` 完整备份，以 `supabase_admin` 恢复到新建独立库 | 通过；恢复事件 8、任务 13、报名 8、签到 6，含原权限/约束；这是当时快照，后续浏览器新增数据不在快照内 |

命令输出和虚构数据截图位于 [evidence](evidence/)。首次恢复使用普通 `postgres` 因 Supabase 内部 realtime 函数的参数权限失败；改用本地管理角色在另一个新库完整恢复成功。未修改应用库权限来绕过限制。

## 本轮集成与修复

1. 接入真实 Dashboard upcoming provider、活动准备面板、任务编辑/筛选活动选项，补充活动/报名导航及页面外壳。
2. UI 公共导出不再传递服务端查询，避免展示组件被 `server-only` 污染。
3. 关联操作反馈和跨页缓存失效；任务/活动保存后重新验证 tasks、events、Dashboard。
4. 任务编辑不再提交禁止更新的来源列，解决真实数据库下所有任务编辑被拒绝的问题。来源关系保留，未扩大列权限。
5. 描述非空校验与数据库一致，避免通用保存失败；日期选项统一悉尼日期；取消/完成活动不再当作 upcoming。
6. 任务列表与 Dashboard 挂载已有提醒组件，沿用既定悉尼日期分类器。

## 非阻塞记录与正式交付门禁

- 筹备面板的候选下拉只显示默认任务查询第一页（20 条）；任务编辑器可选择真实活动作为替代入口。后续由 #18/集成人员补候选分页或搜索。
- 筹备 Link/Unlink 暂无按钮 pending 文案；操作幂等并有完成/错误反馈。按用户标准，不因此否决成员 PR。
- 大量快速自动导航偶见 Next 服务端 `destination stream closed early`，对应中断的流式导航；浏览器没有 pageerror，完成页面与写入结果已复验。
- 2026-09-10 实时 Project 的 Sprint 6 成员确认为 #5、#17、#18、#19、#26、#27、#28；全部仍为 Backlog，Gate 为 Not checked/Incomplete。技术证据与 Project 字段存在滞后，本轮未擅自更新状态。
- 当前验收 PR 仍需要非作者 review 和远程 checks。Sprint 总 PR、main 合并、必要部署验收及人工 Done/关闭尚未完成，不能据此宣布整个 Sprint 已正式结束。
- 回退本轮应用变化应回退验收合并提交并重部署上一版本，不删除报名/签到数据；已有 migration 用备份恢复方案处理，不能通过删除 migration 文件撤回线上 schema。
- 下一周可接收：活动主键和时间字段、身份匹配 port、报名 registered/cancelled 状态、报名/签到独立聚合。#6 保持未完成直到后续 #29。
