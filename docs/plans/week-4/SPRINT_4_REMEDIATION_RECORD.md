# Sprint 4 遗留修复记录

> 日期：2026-08-27（Australia/Sydney）
> 分支：`sprint/4-decision-to-task`

## 已关闭

- 修复 `/tasks/new` 向 Client Component 传递普通服务函数导致的运行时崩溃；仅传递合法 Server Actions；
- 为所有任务路由接入统一 `BackofficeShell`、角色、账号和登出区域；
- Dashboard 改为现有 `/backoffice`，移除尚未实现且会 404 的 Events 导航；
- 任务列表改为单一分隔列表，统一状态标签、层级、操作按钮和焦点样式；
- 创建／编辑／详情／转换页统一 PageFrame、返回路径、反馈状态和响应式节奏；
- 详情页使用成员显示名，不再直接展示 assignee UUID；
- 删除未完整实现的自动暗色变量，避免系统暗色偏好造成黑底白卡和低对比；
- Chrome 桌面和 390×844 窄屏复核无横向溢出，Impeccable layout detector 返回空发现；
- 本地数据库 reset 后 lint 与 diff 均通过，确认没有 migration drift；
- 根据最新范围决定保留会议永久删除，并同步 MVP 与 Week 3 文档。

## 无法由本次工作代替的门禁

| 项目 | 原因 | 所需动作 |
|---|---|---|
| Sprint 4 非作者 review | Codex 自检不能充当团队成员审批 | 指定非作者复核成员 PR／当前集成 diff 并留下真实结论 |
| GitHub Project Status／Acceptance Gate | 仓库规则要求 Joshua 手动维护，且必须基于真实 review | Joshua 在证据核对后手动更新 #3、#15、#23、#24、#25 |
| Stakeholder 阶段评审 | 需要真实参与者、时间、反馈和决定 | 按 `SPRINT_4_STAKEHOLDER_STAGE_REVIEW.md` 执行并签认 |
| Sprint 总 PR 与合并 | 当前改动尚未获得 commit、push、PR 或 merge 授权 | 完成 review／Project／Stakeholder 门禁后另行授权 Git 操作 |
| Week 2／3 历史 review 缺口 | 审批不能事后伪造 | Joshua 明确记录接受历史偏差，后续 Sprint 不再跳过 |
| 生产数据保留期限 | 需要 Stakeholder 隐私决定 | 在接收任何真实参与者数据前批准并同步 PRIV-04 |
