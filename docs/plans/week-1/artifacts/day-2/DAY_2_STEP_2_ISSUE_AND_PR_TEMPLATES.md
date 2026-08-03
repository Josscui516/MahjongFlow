# 第 2 天步骤 2：Issue 与 Pull Request 模板及验证记录

## 1. 执行结论

第 2 天步骤 2 已于 2026-08-04 完成。仓库已建立 feature Issue Form、bug Issue Form、Issue 模板选择器配置和默认 Pull Request 模板。三类模板均使用虚构示例完成字段覆盖检查，协作者无需额外口头背景即可理解问题、范围、验收方式和变更风险。

## 2. 模板清单

| 模板 | 文件 | 主要用途 |
|---|---|---|
| Feature request | [`.github/ISSUE_TEMPLATE/feature.yml`](../../../../../.github/ISSUE_TEMPLATE/feature.yml) | 记录已批准的 MVP 工作或 Post-MVP 想法 |
| Bug report | [`.github/ISSUE_TEMPLATE/bug.yml`](../../../../../.github/ISSUE_TEMPLATE/bug.yml) | 记录可复现缺陷、影响和回归要求 |
| Issue chooser | [`.github/ISSUE_TEMPLATE/config.yml`](../../../../../.github/ISSUE_TEMPLATE/config.yml) | 禁止缺少结构的 blank issue |
| Pull Request | [`.github/pull_request_template.md`](../../../../../.github/pull_request_template.md) | 统一 PR 的范围、证据、安全和回退说明 |

模板依据 GitHub 当前 Issue Forms 与 Pull Request 模板规则建立。GitHub 只会在模板进入默认分支后将其显示在仓库 UI 中；本步骤未获得 commit 或 push 授权，因此当前只完成工作区实现与本地验证。

## 3. Feature 模板示例

以下为按 feature 表单填写的虚构示例，不代表新建 GitHub Issue。

### 标题

`[Feature]: Create and reopen committee meeting records`

### Background and problem

委员会需要把会议标题、日期、时间、参与者、摘要、讨论点和关键决策保存在同一记录中。目前资料分散，成员无法稳定回看会议结论。

### User story

As a committee member, I want to create and reopen a meeting record so that decisions remain available after the meeting.

### Scope and priority

`P0 — approved MVP requirement`

### Requirement or backlog IDs

`MEET-01, MEET-02, MEET-03, MEET-04; US-01; M-01 to M-04`

### In scope

- 创建包含必要会议字段的记录；
- 保存讨论点和关键决策及其顺序；
- 更新摘要或时间；
- 从历史列表重新打开会议详情。

### Out of scope

- 永久删除会议；
- 全文搜索；
- 自动生成会议摘要；
- 邮件或推送通知。

### Acceptance criteria

- [ ] M-01：完整会议提交后保存成功，刷新后字段一致；
- [ ] M-02：缺少必填字段时拒绝提交，数据库不产生不完整记录；
- [ ] M-03：讨论点和关键决策顺序及会议归属正确；
- [ ] M-04：更新后可从历史列表重新打开并看到持久化结果。

### Dependencies

依赖认证会话、委员会角色、会议数据模型、服务端授权和会议页面信息架构；阻塞后续决策转任务流程。

### Test requirements

- 表单必填字段与验证错误测试；
- 会议创建、更新和重新读取集成测试；
- 未登录用户和活动参与者的路由、服务端与 RLS 拒绝测试；
- loading、empty、success 和 error 状态走查。

### Permission, privacy, or sensitive-data impact

`Requires review of authentication or authorisation`

### Readiness checklist

三项均勾选：不含密钥或真实数据；范围和验收信息完整；未引入未经批准的新能力。

## 4. Bug 模板示例

以下为按 bug 表单填写的虚构示例，不代表新建 GitHub Issue。

### 标题

`[Bug]: Concurrent QR submissions create duplicate attendance records`

### Summary and impact

同一虚构参与者快速提交两次有效 QR 签到后出现两条签到记录，破坏唯一签到规则，并可能导致活动统计不准确。

### Related requirement or issue IDs

`CHECKIN-04; US-05; K-04`

### Severity

`High — major P0 flow fails with no safe workaround`

### Environment

`Local development`

### Environment details

Windows 11、Chrome、虚构活动 `Weekly Session Alpha`、本地开发数据库；不含真实环境值。

### Preconditions

虚构参与者已报名，活动 token 有效且处于签到窗口，数据库尚无该参与者的签到记录。

### Reproduction steps

1. 使用虚构参与者打开活动签到入口；
2. 同时发送两次相同签到请求；
3. 等待两个请求返回；
4. 由授权测试账号查询该活动的签到记录。

### Actual result

两个请求均成功，数据库存在两条相同 `event_id + participant_id` 的签到记录。

### Expected result

最多一个请求成功，数据库只保存一条记录；另一个请求返回不泄露参与者信息的重复提交结果。

### Sanitised evidence

使用虚构 UUID 的并发测试输出，预期计数为 `1`，实际计数为 `2`。

### Regression and permission tests

- 并发提交集成测试必须从失败变为通过；
- 数据库唯一约束测试必须通过；
- 过期 token、错误活动和无效参与者仍被拒绝；
- 普通委员会和匿名会话不能读取签到明细。

### Safety checklist

三项均勾选：仅使用虚构数据；不含密钥和未脱敏日志；已检查无重复 Issue。

## 5. Pull Request 模板示例

以下为按 PR 模板填写的虚构示例，只用于验证字段完整性，不代表已有实现、commit 或 Pull Request。

### Related issue and scope

- `Closes #123`；
- Scope classification：`P0`；
- Requirement IDs：`CHECKIN-04, K-04`。

### Summary and rationale

为签到表增加 `event_id + participant_id` 唯一约束，并把重复提交映射为安全、幂等的业务结果，确保并发 QR 请求最终只产生一条记录。

### Changes

- 新增 timestamped SQL migration 和唯一约束；
- 更新签到服务端处理逻辑；
- 增加并发重复提交和权限回归测试；
- 重新生成数据库类型。

### Acceptance scenarios

- [x] K-04：同一活动与参与者并发提交后只有一条签到记录；
- [x] K-03：无效 token、窗口和活动仍被拒绝且不泄露参与者存在性。

### Test evidence

示例填写包含 lint、typecheck、自动化测试、生产构建和手动验收的具体命令与结果；实际 PR 不得把未运行项目标记为通过。

### Permission, privacy, and sensitive-data impact

签到写入仍由服务端验证；普通委员会和匿名会话不能读取明细；RLS 允许／拒绝路径使用虚构账号验证；证据不包含真实参与者资料。

### Database and migration impact

示例填写包含 migration 文件、唯一约束、RLS 影响、部署顺序、回滚或恢复方案、虚构 seed data 影响和 `src/types/database.generated.ts` 结果。

### UI states

示例说明签到提交的 loading、success、重复提交、过期 token、无权限和系统错误反馈。

### Risks and rollback

示例说明部署前重复数据检查、约束创建风险、失败时的安全回退和不可逆操作的备份方案。

### Screenshots or recording

只允许使用虚构参与者和活动；无 UI 变化时必须说明不适用理由。

### Author checklist

八项均可依据示例内容作出明确判断，不需要审查者通过口头沟通补齐范围、测试或安全背景。

## 6. 字段覆盖检查

| 计划要求 | Feature | Bug | Pull Request |
|---|---|---|---|
| 背景／问题 | 必填 | 必填 | 摘要与理由必填说明 |
| 用户故事 | 必填 | 不适用 | 由关联 Issue 提供 |
| 范围／ID | 必填 | 关联受影响 ID | 必填 |
| 验收条件 | 必填 | 预期结果与回归要求 | 逐场景勾选 |
| 依赖 | 必填 | 前置条件 | 由关联 Issue 提供并在风险中补充 |
| 测试要求／证据 | 必填 | 必填 | 命令、方法和结果表 |
| 复现步骤 | 不适用 | 必填 | 不适用 |
| 实际／预期结果 | 不适用 | 必填 | 验收场景结果 |
| 严重程度 | 优先级替代 | 必填 | 风险说明 |
| 环境 | 测试要求中说明 | 必填 | 测试证据中说明 |
| 权限／隐私 | 影响分类 | 回归测试与安全清单 | 独立章节和检查项 |
| 数据库 migration／RLS | 影响分类 | 回归测试 | 独立章节 |
| UI 状态 | 验收与测试要求 | 实际／预期结果 | 独立章节 |
| 风险与回退 | Additional context | 严重程度与影响 | 独立章节 |

## 7. 验证结果

- [x] feature 与 bug 使用 GitHub Issue Forms 当前 YAML 结构；
- [x] `config.yml` 禁止无结构的 blank issue；
- [x] PR 模板位于 GitHub 支持的 `.github/pull_request_template.md`；
- [x] YAML 和 Markdown 已通过 Prettier 解析与格式检查；
- [x] 三类虚构示例均可完整填写，不依赖真实参与者数据；
- [x] 模板覆盖 Day 2 计划和 Git 协作约定的必填信息；
- [x] 未创建分支、commit、push 或真实 Pull Request。

## 8. 官方格式依据

- [GitHub Issue Forms 配置](https://github.com/github/docs/blob/main/content/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository.md)；
- [GitHub Issue Forms 语法](https://github.com/github/docs/blob/main/content/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms.md)；
- [GitHub Pull Request 模板](https://github.com/github/docs/blob/main/content/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository.md)。
