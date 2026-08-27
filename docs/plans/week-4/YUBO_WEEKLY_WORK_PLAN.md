# Yubo：课程第 5 周（开发第 4 周）独立工作计划

所属统一周计划：[决策转任务与 Sprint 4 阶段评审](WEEK_4_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li：任务基础 CRUD 与状态约束](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei：来源保留与决策／讨论点转任务](XUANWEI_WEEKLY_WORK_PLAN.md)

### Sprint 交付路线

- GitHub Sprint：`Sprint 4`；
- Sprint 集成分支：`sprint/4-decision-to-task`；
- 本工作包 Issue 分支：`feature/25-source-navigation`；
- 成员 PR base：`sprint/4-decision-to-task`；
- Sprint 总 PR 主要 Issue：#3；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立交付 #25：会议详情可查看并打开每一条来源任务，任务详情可返回来源会议并识别来源 decision 或 discussion point；来源缺失、不可访问或用户无权限时显示安全、可恢复且不泄露资源存在性的反馈。

## 2. 工作包与文件所有权

- 成员姓名：Yubo Cai；
- 独立工作包：WP-D 会议与来源任务双向导航；
- 主要 Issue：#25；
- 允许修改：`src/features/tasks/source-navigation/`、任务详情 route-local `SourceTraceabilityPanel` 插槽、会议详情 route-local `RelatedTasksPanel` 插槽及 #25 专属测试；
- 禁止修改：Li 的 tasks core／editor、Xuanwei 的 source persistence、Shiying 的 validation、Joshua 的共享验收目录；基础路由需要挂载点变化时由对应所有者实施或明确交接；
- 固定输入合同：`TaskRecordDTO`、`TaskSourceContext`、meeting／task URL namespace、只读来源与关联任务查询接口；
- 输出合同：`SourceTraceabilityPanel`、`RelatedTasksPanel`、描述性双向链接和 missing／denied／system-error 状态；
- 功能自身测试：C-04、C-07 所需的组件、路由、只读查询、missing source、permission-denied 与可访问性测试；
- 共享验收平台边界：完整“会议 → 转换 → 任务 → 会议”E2E、fixture 和阶段评审证据由 Joshua 拥有。

## 3. 开始条件

- #25、依赖 #23／#12、Sprint／assignee／文件边界已确认；
- Li 和 Xuanwei 已冻结 task／source DTO、URL 和挂载点；真实实现未集成时使用 fixture adapter；
- 服务端只读查询返回最小非敏感字段，missing 与 forbidden 不向未授权会话暴露差异；
- 已读取当前 Next.js 本地文档中 Link、dynamic routes、not-found、loading／error 和 Server Components 的适用章节；
- 使用虚构 meeting、source 和 task 数据进行测试及截图。

## 4. 独立执行步骤

### 步骤 1：冻结导航投影与状态

执行：

1. 将 C-04／C-07 映射为 meeting → task、task → meeting、missing、denied 和 system error 场景；
2. 定义最小 `SourceTraceabilityView` 与 `RelatedTaskSummary`，不把完整数据库记录交给客户端；
3. 冻结两个 route-local 插槽、描述性 link label 和 fixture adapter。

产出：双向导航合同、状态矩阵和独立 fixture。

检查：消费者不需要导入 repository 或 server-only 模块，未授权响应不枚举来源是否存在。

### 步骤 2：实现双向导航组件

执行：

1. 实现会议详情关联任务列表，显示任务标题和清楚的来源标签；
2. 实现任务详情来源面板，提供返回会议的描述性链接并显示 decision／discussion 上下文；
3. 实现 loading、empty／no sourced tasks、missing source、permission denied 和 system error 状态；
4. 只通过冻结挂载点接入基础路由，若挂载点变化则交给 Li／Xuanwei 处理。

产出：`RelatedTasksPanel`、`SourceTraceabilityPanel` 和只读查询 adapter。

检查：双向链接刷新安全、键盘可用、窄屏不溢出，来源文本不会成为越权数据通道。

### 步骤 3：个人测试与边界验证

执行：

1. 验证 decision sourced task 与 discussion sourced task 的 C-04；
2. 验证无来源、来源被移除／不可达、无权访问和系统失败；
3. 验证 committee／authorised allow 与 anonymous／participant route／server deny，检查 link label 可访问性；
4. 运行 #25 专属测试、lint、typecheck 和适用 build。

产出：C-04、C-07 的个人验证证据与窄屏／键盘检查摘要。

检查：无 broken link、无内容泄露、无 Client Component server-only import。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理导航合同、挂载点、测试结果、权限与 UI 状态；
2. 创建或更新只关联 #25、以 Sprint 分支为 base 的成员 PR；
3. 完成自查、非作者 review 和 checks；
4. 合并后确认 #25 保持 `Testing`；
5. 向 Joshua 一次性交付 PR、C-04／C-07、截图要求和风险。

产出：#25 成员 PR 和可直接进入完整流程演示的交接包。

检查：Joshua 可从会议进入任务再返回来源会议，不需要修改导航实现。

## 5. 低频沟通规则

- 周初只冻结 DTO、URL、查询 shape、挂载点和状态；
- 真实实现未集成时使用 fixture adapter，不跨目录实现 tasks core 或 conversion source；
- 只有挂载点阻断、URL 冲突、权限泄露或安全问题才沟通；
- 完成后只向 Joshua 一次性交接。

## 6. 个人交付物

- `RelatedTasksPanel`、`SourceTraceabilityPanel` 和只读查询投影；
- C-04、C-07 功能自身测试及可访问性／窄屏证据；
- 权限、缺失来源、错误状态和接口说明；
- #25 PR 与 Sprint 集成证据。

## 7. 个人验收清单

- [ ] C-04、C-07 通过；
- [ ] decision／discussion 来源标签与双向链接正确；
- [ ] missing、denied、empty 和 system error 安全可理解且不泄露；
- [ ] 只修改允许范围，基础路由变化经所有者实施或明确交接；
- [ ] Client Component 未导入 server-only 模块或完整数据库类型；
- [ ] lint、typecheck、专属测试和适用 build 通过；
- [ ] PR、review、checks 和一次性交接完整；
- [ ] 合并后 #25 保持 `Testing`。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 基础 task／meeting 页面没有稳定挂载点 | 需要与 #15／#23 同改页面 | 无法通过组件插槽接入 | 提交最小挂载点请求，由 Li／Xuanwei 修改或显式交接 | Yubo | 集成前 |
| missing 与 forbidden 响应可区分 | 泄露会议或任务存在性 | 未授权用户看到不同资源细节 | 统一安全错误投影并补权限测试 | Yubo | PR 前 |

## 9. 未完成项处理

- C-04／C-07、权限或 broken link 失败会阻止交接；
- 不直接修改他人基础路由私有逻辑；
- 搜索、关系图、批量导航或额外来源预览进入 Post-MVP；
- 安全、数据泄露或密钥风险立即升级。

## 10. 周末交接

- 已完成：会议与任务双向导航、来源标签和安全状态；
- 未完成：记录原因、负责人、期限和下次检查；
- 输出合同：两个导航 panel、只读投影、URL 和错误语义；
- 集成注意事项：使用公开 DTO，不读取 repository；无权与缺失响应保持非枚举；
- Sprint 总 PR 证据：#25、PR、checks、review、C-04／C-07、窄屏和可访问性摘要；
- 下周建议：Dashboard 只链接任务公开详情，不复制来源导航逻辑。
