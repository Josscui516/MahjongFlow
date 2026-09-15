# Sprint 5 内部走查

## 方法与限制

2026-09-15，Joshua 明确授权 Codex 使用 Chrome 在本机完成视觉和功能走查，并豁免本次其他成员操作。执行者为 Codex，责任人为 Joshua；**没有招募真人参与者，不提供人数、成功率或真实用户可用性研究结论**。账号、会议、任务和活动关系全部虚构，环境为本机 production build + 真实 Supabase Auth／PostgREST／RLS。

## 执行结果

| 路径 | 实际结果 |
|---|---|
| 匿名直接访问 Dashboard／Tasks | 重定向登录，保留目标路径 |
| committee 登录 Dashboard | 四个任务区块、共享后台导航、提醒和诚实活动占位可见 |
| Dashboard→逾期任务→编辑 Completed→返回 | 保存成功，任务退出逾期和本人未完成，已访问页面统计刷新 |
| 375px Dashboard→移动菜单→Tasks | 提醒文本可读，菜单可导航，无横向溢出 |
| 四项组合筛选→URL 重载 | 虚构负责人＋not_started＋活动 ID＋今天返回唯一任务；重载保持 |
| 320px 任务列表及 Tab 键 | 提醒换行，按钮焦点可见；文档宽度不超过视口 |
| 非法活动 ID／清除／无匹配查询 | 分别显示非法筛选、恢复列表、无匹配任务 |
| 会议决策→转任务→空提交 | 必填字段提示，来源保留 |
| 有效转换→Open created task→详情 | 成功、负责人／截止日期正确，来源链接完整 |
| 新任务→Dashboard→完成→来源会议 | 新任务可发现；完成保存且来源不变；会议 Related tasks 可返回任务 |
| 同一决策再次转换 | Task already exists，无重复任务 |
| authorised 登录 | Tasks 可访问，本人无未完成任务时显示空状态 |
| 已认证但无后台 profile 用户→Dashboard／Tasks | 仅权限拒绝，无任务内容 |

过程中修复了转换后的入口和刷新、来源列写入、提醒挂载和导航问题，修复后复验通过。最后检查 Chrome warning/error 日志为空。loading、系统错误、非法日期和拒绝写入的不可稳定手工触发路径由自动化回归覆盖，不宣称逐一通过浏览器故障注入。

## 视觉证据

- [桌面 Dashboard](evidence/dashboard-desktop.png)
- [375px Dashboard](evidence/dashboard-mobile.png)
- [320px 筛选与键盘焦点](evidence/task-filters-mobile.png)
- [authorised 本人空状态](evidence/dashboard-empty-authorised.png)
- [无后台权限拒绝](evidence/dashboard-permission-denied.png)

截图是各场景执行时的状态快照，后续写入导致任务数字变化属预期。技术检查和需求映射见[验收记录](TASK_FOLLOW_UP_ACCEPTANCE_RECORD.md)。阻断缺陷剩余 0；真实活动部分按 Sprint 6 #18/#19 继续，不记作 Sprint 5 遗漏。
