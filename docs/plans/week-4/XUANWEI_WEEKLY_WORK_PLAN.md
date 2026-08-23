# Xuanwei：课程第 5 周（开发第 4 周）独立工作计划

所属统一周计划：[决策转任务与 Sprint 4 阶段评审](WEEK_4_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li：任务基础 CRUD 与状态约束](LI_WEEKLY_WORK_PLAN.md)

### Sprint 交付路线

- GitHub Sprint：`Sprint 4`；
- Sprint 集成分支：`sprint/4-decision-to-task`；
- 本工作包 Issue 分支：`feature/23-decision-task-source`；
- 成员 PR base：`sprint/4-decision-to-task`；
- Sprint 总 PR 主要 Issue：#3；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立交付 #23：委员会用户可以从关键决策或讨论点进入任务创建流程，看到不可伪造的来源上下文，并在一次成功提交中创建且仅创建一条带正确 meeting、decision 或 discussion point 来源的任务；匿名／参与者不能调用该流程。

## 2. 工作包与文件所有权

- 成员姓名：Xuanwei Xu；
- 独立工作包：WP-B 来源上下文、转换入口与来源持久化；
- 主要 Issue：#23；
- 允许修改：`src/features/tasks/conversion/source/`、`src/features/meetings/agenda/TaskConversionEntry.tsx`、转换入口路由及 #23 专属测试；现有来源约束确有缺口时可新增 #23 migration、数据库测试、运维说明和生成类型；
- 禁止修改：Li 的 tasks core／editor、Shiying 的 conversion validation、Yubo 的 source-navigation、Joshua 的共享验收目录；
- 固定输入合同：Li 的 `TaskEditorPort`／`TaskRecordDTO`；Sprint 3 meeting／agenda DTO；Shiying 冻结的 validation result mock；
- 输出合同：`TaskSourceContext`、`TaskConversionPort`、decision／discussion entry、原子来源持久化和稳定错误语义；
- 功能自身测试：C-01、C-02、C-05、C-07 所需的入口、服务、外键、重复提交、route／server／RLS 测试；
- 共享验收平台边界：跨包 C-01–C-07 harness、fixture 与阶段评审证据由 Joshua 拥有。

## 3. 开始条件

- #23、依赖 #13／#15、`Sprint 4`、assignee 和文件边界已确认；
- Sprint 3 的 meeting／agenda 合同可读，Li 的 task port／DTO 已冻结；未集成时使用 mock；
- `TaskSourceContext` 明确要求 meeting ID，decision 与 discussion point 至多一个，来源字段不可由普通表单文本伪造；
- 已读取当前 Next.js 本地文档中 forms／Server Actions、dynamic routes 和 navigation 的适用章节；
- 只使用虚构会议、决策、讨论点和用户数据。

## 4. 独立执行步骤

### 步骤 1：冻结来源合同与威胁边界

执行：

1. 对照 #23、C-01／02／05／07 和现有数据库来源约束核对字段与关系；
2. 定义 `TaskSourceContext`、`TaskConversionPort` 和服务端重新读取来源的规则；
3. 建立 decision／discussion 两类 fixture、重复提交和伪造／无权来源测试基线。

产出：来源合同、权限／完整性矩阵和可替换 mock。

检查：浏览器输入不能自行决定可信来源；失败不会创建 task 或部分来源记录。

### 步骤 2：实现转换入口与来源持久化

执行：

1. 在会议 agenda 表面提供决策和讨论点的任务创建入口，传递最小 source identifier；
2. 在服务端验证当前用户、meeting 与子记录归属，构造安全来源上下文；
3. 通过 Li 的 task port 创建至多一条任务并持久化正确来源；
4. 覆盖 loading、source missing、permission denied、duplicate submission、validation handoff 和 system error 状态。

产出：可由 Shiying 表单与 Yubo 导航消费的 conversion source 模块。

检查：decision 路径保存 meeting＋decision；discussion 路径保存 meeting＋discussion 且 decision 为空。

### 步骤 3：个人测试与边界验证

执行：

1. 验证 C-01、C-02、C-05 的成功和刷新路径；
2. 验证双击／重放至多创建一条、来源不匹配、missing source 和数据库失败；
3. 验证 committee／authorised allow 与 anonymous／participant route／server／RLS deny；
4. 运行 #23 专属测试、lint、typecheck、适用数据库测试和 build。

产出：C-01、C-02、C-05、C-07 的个人验证证据。

检查：来源关系、原子性、权限和错误语义全部通过，测试只用虚构数据。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理 source contract、公开 adapter、测试结果和 migration／RLS 影响；
2. 创建或更新只关联 #23、以 Sprint 分支为 base 的成员 PR；
3. 完成自查、非作者 review 和 checks；
4. 合并后确认 #23 保持 `Testing`；
5. 向 Joshua 一次性交付 PR、C 场景证据、接口和风险。

产出：#23 成员 PR 和可供 #24／#25／#3 使用的来源交接包。

检查：接收者只需公开合同即可集成，无需修改 Xuanwei 私有实现。

## 5. 低频沟通规则

- 周初只冻结 source contract、task port、agenda entry slot 和 Sprint 路线；
- Li 输出尚未集成时使用 mock，不等待或跨目录实现 tasks core；
- validation 变化交给 Shiying，导航变化交给 Yubo；只有阻断合同或安全问题才临时沟通；
- 完成后只向 Joshua 一次性交接。

## 6. 个人交付物

- decision／discussion 转任务入口与 `TaskSourceContext`／`TaskConversionPort`；
- 来源校验、原子创建、重复提交和三层权限测试；
- migration／RLS／生成类型影响或 N/A 说明；
- #23 PR、风险与交接记录。

## 7. 个人验收清单

- [ ] C-01、C-02、C-05、C-07 通过；
- [ ] 每次成功提交只创建一条任务，来源 meeting／decision／discussion 正确；
- [ ] 伪造、缺失、不匹配和无权来源安全失败；
- [ ] 只修改允许范围，公开合同与 fixture 可供下游独立消费；
- [ ] 适用 lint、typecheck、测试、数据库检查和 build 通过；
- [ ] PR 路线、review、checks 和一次性交接完整；
- [ ] 合并后 #23 保持 `Testing`，未提前关闭。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| #15 port 与 source 字段不兼容 | 无法持久化完整来源 | mock 与真实实现接入失败 | 向 Li 提交合同变更记录，不直接修改 tasks core | Xuanwei | 单次集成前 |
| 客户端可伪造来源 | 错误追踪或越权关联 | 服务端未重新读取并核对归属 | 阻止 PR，补服务端与数据库拒绝测试 | Xuanwei | PR 前 |

## 9. 未完成项处理

- 来源完整性、权限或重复创建失败会阻止交接；
- 不跨目录修改 Li、Shiying、Yubo 或 Joshua 的文件；
- 新的转换类型、批量转换或多来源能力进入 Post-MVP；
- 安全、数据丢失或密钥风险立即升级。

## 10. 周末交接

- 已完成：decision／discussion 入口、可信来源上下文与原子任务创建；
- 未完成：记录原因、负责人、期限和下次检查；
- 输出合同：`TaskSourceContext`、`TaskConversionPort`、稳定错误语义；
- 集成注意事项：Shiying 只消费校验入口，Yubo 只消费只读来源投影；
- Sprint 总 PR 证据：#23、PR、checks、review、C-01／02／05／07 和数据库影响；
- 下周建议：保留来源字段只读，不让筛选或 Dashboard 重写来源语义。
