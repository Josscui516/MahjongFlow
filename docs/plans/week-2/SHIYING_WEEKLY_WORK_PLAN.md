# Shiying：课程第 3 周（开发第 2 周）独立工作计划

所属统一周计划：[认证、权限与数据基础](WEEK_2_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Joshua 的认证错误合同](JOSHUA_WEEKLY_WORK_PLAN.md)和 [Xuanwei 的 AccessContext](XUANWEI_WEEKLY_WORK_PLAN.md)。独立阶段使用冻结 mock，不等待真实实现。

## 1. 独立目标

独立完成受保护后台布局、角色感知导航、基础表单和 loading／empty／success／error／permission denied 组件，覆盖 X-07。工作期间不修改认证逻辑、database migration、RLS 或测试基础配置。

## 2. 工作包与文件所有权

- 成员姓名：Shiying；
- GitHub Assignee：`Scarletthekiller`；
- 独立工作包：WP-D 共享 UI；
- 主要 Issue：#11；
- 允许修改：`src/components/layout/`、`src/components/forms/`、`src/components/feedback/`、受保护 layout、组件测试；
- 禁止修改：认证 session／actions、`src/lib/auth/authorization.ts`、`supabase/`、CI／验收配置；
- 固定输入合同：认证错误码；`AccessContext { userId, role }`；
- 输出合同：后台 layout、导航、表单字段和五类反馈组件；
- 集中非作者审查人：Joshua，只在完成后审查一次。

## 3. 开始条件

- Week 1 信息架构和低保真线框可用；
- 认证错误码与 `AccessContext` 已冻结；
- 已建立 committee／authorised mock 和各反馈状态 fixture；
- Issue #11 满足开始条件；
- 后续业务页面不在本工作包范围。

## 4. 独立执行步骤

### 步骤 1：建立布局和组件合同

执行：

1. 建立登录外壳与受保护后台 layout；
2. 定义页头、导航、内容、用户与登出槽位；
3. 建立表单字段、说明、错误和提交状态接口；
4. 使用 mock `AccessContext` 驱动角色显示。

产出：共享 layout 和组件 API。

检查：组件不依赖真实数据库或认证实现即可渲染。

### 步骤 2：完成导航与反馈组件

执行：

1. 实现 committee／authorised 导航差异；
2. 实现 loading、empty、success、error 和 permission denied；
3. 错误文案不泄露账号或资源是否存在；
4. 保持桌面、窄屏和键盘可操作。

产出：Issue #11 的共享 UI 组件。

检查：五类状态清晰可区分，无空白或无限等待。

### 步骤 3：个人组件验证

执行：

1. 覆盖表单标签、错误关联和重复提交保护；
2. 覆盖两种角色导航和 permission denied；
3. 覆盖窄屏、键盘和五类状态；
4. 运行 lint、typecheck、组件测试和 build。

产出：X-07 个人验证证据。

检查：组件测试通过，UI 不自行决定服务端权限。

### 步骤 4：一次性交接

执行：

1. 在单次集成时替换 mock，消费 Joshua 错误码和 Xuanwei `AccessContext`；
2. 不修改两人的文件，接口不兼容时提交变更请求；
3. 向 Yubo 交付组件测试入口；
4. 整理使用说明和下周会议页面接入方式。

产出：共享 UI 交接包。

检查：应用可以通过公开 props／类型接入，不需要了解内部样式实现。

## 5. 低频沟通规则

- 周初冻结错误码、`AccessContext` 和组件槽位；
- 通过 mock 独立工作，不安排日常同步；
- 只有冻结合同无法表达 X-07、直接 URL 出现安全风险或构建阻断时沟通；
- 不修改 Joshua、Xuanwei 或 Yubo 文件；
- 完成后由 Joshua 集中审查一次。

## 6. 个人交付物

- 受保护后台 layout 和导航；
- 基础表单组件；
- 五类反馈组件；
- 组件测试与 X-07 证据；
- UI API 和集成说明。

## 7. 个人验收清单

- [ ] 五类反馈状态通过；
- [ ] 两种角色导航可用；
- [ ] 表单、键盘和窄屏检查通过；
- [ ] 只修改允许文件范围；
- [ ] 不以 UI 隐藏替代服务端权限；
- [ ] lint、typecheck、组件测试和 build 通过；
- [ ] 交接包可独立消费；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 组件过度抽象 | 延期且难以使用 | X-07 无法用实际组件复现 | 缩减为登录和后台外壳所需 API | Shiying | 个人验收前 |
| `AccessContext` 集成不兼容 | 导航无法接真实角色 | 单次集成类型失败 | 向 Xuanwei 提变更请求，不修改授权模块 | Shiying／Xuanwei | 集成检查点 |

## 9. 未完成项处理

- 权限泄露、无限等待或敏感错误信息立即升级；
- 纯视觉润色进入 backlog；
- 不通过假业务页面扩大范围；
- 未通过 X-07 不进入集成。

## 10. 周末交接

- 已完成：layout、导航、表单和五类反馈组件；
- 未完成：按实际结果记录；
- 输出合同：组件 props、状态合同和测试入口；
- 集成注意事项：UI 只消费可信服务端角色，不负责授权；
- 下周建议：会议页面复用现有组件，不另建平行体系。
