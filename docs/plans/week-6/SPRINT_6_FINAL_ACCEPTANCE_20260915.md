# Sprint 6 最终集成验收（2026-09-15）

## 结论与一次性授权

开发第 6 周（课程第 7 周）活动与报名功能已完成本地最终集成及技术验收。Joshua 本次明确授权由其接手剩余实现、修复、验收和项目板维护，免除其他成员操作及独立审查要求；此例外仅适用于本次 Sprint 6，不修改长期协作规则，也不伪造 GitHub approval。最终交付为 Sprint 总 PR，尚未合并 main、部署或关闭 Issues。

权威范围为 MVP 提案及本周五份成员计划；实时 Project Sprint 6 成员精确为 #5、#17、#18、#19、#26、#27、#28。#6 是跨周 epic，#29、二维码签到、晚餐和 P1 自助报名不在本次完成集合内。

## 集成版本与缺口关闭

- 已复核所有远程成员分支，六个功能 tip 已在 Sprint 6 中；对应 PR #73、#74、#75、#77、#79、#80 已合并，无遗漏的仅推分支功能。
- 合并剩余 #81，Sprint 基线为 `374f47a`。同步 main `93ac15a`（Sprint 5 总 PR #83），解决八处冲突，保留任务完成、返回筛选上下文、Dashboard 分组、提醒与真实活动适配。
- 普通委员会活动详情现在挂载安全报名／签到数字；名单仍只允许 authorised。加载和查询失败不伪装成零人数。
- 筹备候选任务新增分页，超过 20 条仍可关联；关联／解除按钮有 pending 锁和反馈。
- Chrome 发现原生日期控件显示值与 React 状态可能不同步；提交改为读取具名 FormData 后走同一验证，补日期／字段回归测试。
- 报名页去除嵌套 main 与多余移动端内边距；活动各卡片增加分隔。

## 最终验收矩阵

| 范围／归属 | 实测结果 |
|---|---|
| E-01/02/03，#17 | Chrome 创建周常与锦标赛，保存、重载、编辑；Sydney 日期往返正确；空值、类型、状态和日期边界由自动测试覆盖 |
| E-04/05、完整 T-05，#18 | 真实任务关联 0/0 → 1/3 → 2/3 → 3/3；完成状态即时反映；第二页候选关联／解除；任务编辑和新建关联真实活动；保留筛选返回上下文 |
| E-06、完整 T-06，#19 | Dashboard 真实 upcoming 数据，按时间稳定排序；过去／完成／取消不列入；未完成任务随操作更新，空／错路径自动测试通过 |
| R-01/02/06，#26 | 姓名去首尾空白、邮箱规范化；普通报名不需学号；要求学号的锦标赛缺失被拒绝，补齐成功；最少字段与身份并发测试通过 |
| R-03/08，#27 | 首次登记、重复不增行、取消、恢复均实测；服务端及 RLS 禁止 committee／匿名写入 |
| R-04/05，#28 | 后台隐私确认允许未记录；报名不创建签到。独立人工签到 fixture 后取消报名，生产页显示报名 0／签到 1，恢复后 1／1 |
| E-07、权限与隐私，#5 | Chrome 匿名跳转登录；committee 可看活动、筹备和安全人数，直达名单显示拒绝；authorised 可登记。数据库 allow/deny 覆盖；无真实参与者数据 |
| 跨页／响应式，#5 | Chrome 开发与生产构建真实 Auth/PostgREST，活动改期／地点保留关系；桌面及 390×844 移动端检查，无横向溢出；最终生产页 console error/warn 为零 |

手工签到仅为隔离数据库虚构 fixture，不代表 Sprint 7 签到 UI 实现。浏览器使用 Chrome 扩展实际操作，不使用 mock API；生产版本在 localhost:4337，开发版本 localhost:4336。使用 localhost 避免开发服务器跨 origin 资源限制，未放宽安全设置。

## 自动验证与数据库证据

| 检查 | 结果 |
|---|---|
| npm run lint / npm run typecheck | 通过 |
| npm test | 104 suites、603 应用测试通过；另 5 项脚本测试通过；3 项需真实环境的测试默认跳过 |
| npm run test:acceptance | 21 suites、149 测试通过（上述应用测试子集）；同 3 项环境测试默认跳过 |
| Sprint 5 真实运行时回归 | 3 项单独通过真实 Auth/PostgREST/RLS；使用现有 local-runtime fixture，临时适配隔离 workdir／端口／容器，不计为新的测试 |
| 生产构建 | Next build --webpack 通过，随后启动生产服务器并进行 Chrome 验收 |
| 干净 migration 重放 | 隔离 Supabase 先 --no-seed reset，再带 seed reset，均通过 |
| SQL 全量 | 递归执行全部 11 SQL suites，349 断言通过 |
| 并发 | 报名 18、RLS 9 断言通过；参与者身份并发脚本通过 |
| Schema / 类型 | db lint 无错误；db diff 无变化；public,graphql_public 生成类型与仓库一致（忽略换行空白） |
| 恢复 | 完整 pg_dump 在新独立数据库以 supabase_admin 恢复成功；快照活动 6、任务 4、报名 6、签到 3、policy 31，与源快照一致 |

隔离项目名 `mahjongflow-sprint6-acceptance`，使用 46321 API、46322 DB，未修改用户原有开发服务器或远程数据库。运行凭证和原始管理日志仅留在临时目录，未纳入证据。恢复数字是浏览器新增数据前的快照，不是最终业务统计。

## Migration、部署及回退

相对 main 新增 migration 为 `20260908232400_enforce_participant_name_normalisation.sql`，约束参与者姓名规范化；本轮缺口修复未新增 schema。现有 event/participant 唯一约束、外键、RLS 与生成类型已重放验证。部署必须先按时间顺序执行 migration，再部署应用；真实环境尚未执行。

应用回退使用上一部署版本／经批准回退 Sprint 合并提交；不得删除参与者、报名或签到数据。Schema 回退依照数据库运维文档备份恢复，不能通过删除 migration 文件撤销远程变更。完整恢复演练已在隔离库完成。

## 交付状态及证据

本记录取代早期验收记录的当前状态结论，保留旧文档作为历史过程。七项 Issue 的技术验收达到 Testing／Acceptance Gate Passed；main 总 PR 和远程 checks 单独记录在 GitHub。所有 Issues 保持 open，未标记 Done；main 合并与部署仍是后续正式交付步骤。

- [普通委员会安全人数](evidence/final/production-committee-event.png)
- [生产桌面 Dashboard](evidence/final/production-dashboard-desktop.png)
- [生产移动 Dashboard](evidence/final/production-dashboard-mobile.png)
- [生产移动报名表单](evidence/final/production-registration-mobile.png)
- [活动移动布局](evidence/final/event-mobile.png)

历史 evidence 根目录日志对应 2026-09-10；本次最终证据位于 final 子目录，不把旧脚本运行结果冒充为本次执行。
