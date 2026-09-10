# #28：隐私确认与报名／签到分离

主 Issue：#28；需求 REG-05、REG-07；场景 R-04、R-05。基线为已经合入 #17/#26/#27 及集成修复的 Sprint 6。与 #27 保持独立 PR。

## 行为与边界

- 后台登记明确写入 `privacy_notice_acknowledged_at: null`，不假造同意时间。唯一冲突只读取已有报名，不覆盖已有隐私确认、取消状态或审计字段。
- 授权名单显示已有确认时间（悉尼时区），空值显示允许后台登记不记录。该字段只存在授权名单 DTO，不进入安全聚合。
- 同一次现有 `get_event_participation_totals` RPC 返回当前 Registered 数和 Confirmed attendance 数，明确白名单投影为两个整数。不读身份明细、不用报名数推算签到数；人数为零、加载中、不可用明确区分。
- 页面解释报名不确认出席，也不赋予晚餐资格。取消报名不删除已有签到。没有新增签到按钮、签到写入、资格计算或自助报名入口。
- 自助报名仍禁用；现有服务要求 authorised，拒绝前端附加 selfService 和伪造确认时间。若未来 P1 启用，必须另行实现真实隐私确认流程，不能复用当前无确认后台入口当作自助接口。

## 数据库与回滚

已有 nullable 列、独立 attendance 表、安全聚合、RLS 和约束足够，本次无 migration、生成类型、权限或 schema 变更。SQL 测试证明空确认、重复不覆盖、取消／恢复不签到、已有签到保持，以及委员会／匿名权限。测试中人工插入的签到仅是虚构 fixture，不是新增应用签到功能。应用回滚可还原本 PR，既有记录结构不受影响。

## 验证

- 应用全量、lint、typecheck 和 webpack 生产构建通过；具体最终数量见 PR。
- `supabase/tests/constraints/issue-28-registration-attendance-separation.sql`：20 项通过，独立可丢弃 PostgreSQL 容器内运行，全事务回滚。
- 真实 Supabase SDK／模拟 HTTP 测试验证单次 RPC、请求字段、角色边界、错误映射、异常数字和敏感字段丢弃；不将其描述为真实 HTTP 集成。
- Chrome 浏览器验证使用真实组件和虚构 action，在 1280px／360px 检查登记、重复、传输失败恢复、取消／恢复时签到数不变、汇总不可用不显示零，无页面异常或横向溢出。Browser skill 不可用，按前端测试 skill 使用现有 Playwright／Chrome。
- `evidence/desktop.png`、`mobile.png` 为该组件验证截图，明确标记虚构 fixture；不是实际登录后连接 Supabase 的端到端证据。服务器组合测试和真实 PostgreSQL 测试分别覆盖其边界。

## 尚未声称完成的事项

Sprint 6 其他成员任务、总验收、main 合并／部署不在本 PR 内。完整本地 Supabase 套件在裸 PostgreSQL 镜像中不可运行，原因详见 Sprint 集成审查记录；远程 CI 的 Database 作业另行验证完整环境。没有关闭任何 Issue 或将整个 Sprint 标记为 Done。
