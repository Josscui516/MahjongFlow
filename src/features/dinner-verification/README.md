# 独立晚餐名册与授权核验

2026-10-04 用户纠正：晚餐不是签到奖励，使用管理员预录名册。完整决定、权限、迁移和回退见 [需求纠正](../../../docs/project/REGISTRATION_AND_DINNER_CORRECTION.md)。旧 evidence 和验收材料仅保留为原日期的历史实现证据。

## 入口与规则

活动详情 → Verify dinner eligibility → 晚餐核验页。管理员看到 Manage dinner roster，可用姓名／邮箱预录、恢复、移除；授权非管理员仅核验。每个活动独立维护名册，不自动导入报名／签到记录。

`roster.ts` 通过用户会话执行 authorised 鉴权与表级 RLS；管理员写还检查 canManageAccounts。`server.ts` 消费名册读端口，`calculateDinnerEligibility` 只接受同活动、同名册记录的 listed 状态。removed 或缺失不是资格；不会读取签到事实。

名单最小 DTO 不暴露学号、录入者或 Auth 资料。刷新逻辑保留旧值／过期提示、最新请求优先及失败时禁止依赖陈旧结果的约定。

## 验证

`database.test.ts` 是 opt-in 的真实本地测试：使用忽略 .env.local 的本地连接，只创建随机虚构账号和限定资源，结束后清理自身数据；设置 ISSUE35_LIVE_DATABASE=1 运行。覆盖公开报名、签到不授予资格、预录不需要报名、移除、并发唯一性、窗口／撤销、隐私同意和三层权限。

单元测试覆盖名册纯规则、适配器、刷新与界面，浏览器实测覆盖录入、移除、授权人员只读和扫码报名。旧 attendance 版浏览器脚本／截图不证明本版行为。
