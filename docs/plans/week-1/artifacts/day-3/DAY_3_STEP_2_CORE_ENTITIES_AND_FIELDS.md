# 第 3 天步骤 2：核心实体说明与字段草案

> 所属计划：[第 3 天：数据库、权限与隐私设计](../../DAY_3_DATA_SECURITY_AND_PRIVACY.md)
> 直接输入：[步骤 1：P0 数据需求及字段候选清单](DAY_3_STEP_1_P0_DATA_REQUIREMENTS.md)
> P0 范围：[第 1 天 P0 功能范围清单](../day-1/DAY_1_P0_SCOPE_CHECKLIST.md)
> 验收依据：[第 1 天 P0 用户故事与验收矩阵](../day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md)
> 执行日期：2026-08-04
> 状态：步骤 2 完成；关系图、删除行为和约束实现留给步骤 3–4

## 1. 执行结论

已为 9 个计划要求的核心实体定义职责、字段、PostgreSQL 数据类型方向、
可空性和业务用途：`profiles`、`meetings`、`discussion_points`、
`meeting_decisions`、`tasks`、`events`、`participants`、`registrations` 和
`attendance_records`。

为完整表达已批准的 P0，还定义了两个仅承担关系／安全职责的支撑实体：

- `meeting_attendees`：将会议参与者建模为后台用户关系，避免 UUID 数组绕过
  外键和 RLS；
- `event_check_in_tokens`：只保存 token 摘要和生命周期元数据，避免把可直接
  使用的明文 token 放进 `events` 或普通活动响应。

本步骤不创建 SQL migration，不绘制最终 ERD，不确定外键删除行为，也不把
唯一性、检查约束或 RLS 视为已经实现。上述内容分别在步骤 3–5 完成。

## 2. 字段设计约定

### 2.1 数据类型方向

| 类型方向 | 用途 | 说明 |
|---|---|---|
| `uuid` | 主键和实体关系 | 业务实体使用随机 UUID；`profiles.id` 与 Supabase Auth 用户 ID 对齐 |
| `text` | 名称、标题、描述和摘要 | 长度、去空白和格式限制在步骤 4 定义 |
| `integer` | 子项顺序 | 仅接受非负整数的规则在步骤 4 定义 |
| `boolean` | 明确的二值配置 | 只用于活动是否要求学号等配置，不存派生业务结果 |
| `date` | 任务截止日期 | 与 Sydney 本地日期的逾期规则一致 |
| `timestamptz` | 事件时刻和审计时间 | 数据库存绝对时刻，界面按 `Australia/Sydney` 显示 |
| PostgreSQL enum 或受约束 `text` | 有限状态集合 | 最终采用 enum 还是 `text + CHECK` 在步骤 4 固定 |

### 2.2 可空性标记

| 标记 | 含义 |
|---|---|
| 否 | `NOT NULL` 方向；每条记录必须有值 |
| 是 | 业务上可以没有值 |
| 条件 | 由同一记录的类型、状态或创建路径决定；步骤 4 必须提供约束或服务端校验 |

所有 `created_at` 和 `updated_at` 均使用 `timestamptz`。`created_at` 在插入时
由数据库生成；`updated_at` 在插入及实际更新时由数据库统一维护，客户端不得
自报审计时间。

## 3. 核心实体总览

| 实体 | 单条记录代表什么 | 主要 P0 用途 | 数据级别 |
|---|---|---|---|
| `profiles` | 一个可进入委员会后台的 Auth 用户资料 | 角色、负责人、创建者和人工修正者 | 内部／角色敏感 |
| `meetings` | 一次委员会会议 | 会议历史和来源上下文 | 内部 |
| `discussion_points` | 某会议中的一个有序讨论点 | 结构化记录和任务来源 | 内部 |
| `meeting_decisions` | 某会议中的一个有序关键决策 | 结构化结论和任务来源 | 内部 |
| `tasks` | 一个可跟进的行动项 | 负责人、状态、到期、来源与活动筹备 | 内部 |
| `events` | 一次周常活动或比赛 | 活动资料、签到窗口和任务关联目标 | 内部；部分字段可在 token 页最小展示 |
| `participants` | 一个跨活动识别的最小参与者主记录 | 报名匹配、签到和现场身份确认 | Sensitive |
| `registrations` | 某参与者在某活动的报名事实 | 区分报名和实际签到 | Sensitive |
| `attendance_records` | 某参与者在某活动的签到事实及当前有效状态 | 到场明细、人工更正和资格推导 | Sensitive |

## 4. `profiles`

### 4.1 职责

保存委员会后台用户的最小业务资料。认证邮箱、密码、会话和访问 token 继续
由 Supabase Auth 管理，不复制到本表。

### 4.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 对应 Auth 用户 ID | 主键；任务负责人、创建者和人工修正者的引用目标 |
| `display_name` | `text` | 否 | 受控账号初始化 | 后台显示、会议参与者和负责人选择 |
| `committee_role` | `committee_role` | 否 | 受控配置 | `committee` 与 `authorised` 权限判断；`secretary` 作为获得 authorised 能力的业务身份在权限规则中说明 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 资料建立时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 资料最近更新时间 |

### 4.3 设计说明

- P0 不提供角色管理或个人资料管理页面；角色写入只能走受控维护流程；
- 不保存第二份登录邮箱，避免 Auth 与业务表值漂移；
- 后续步骤必须保证普通用户不能自行提升 `committee_role`。

## 5. `meetings` 与 `meeting_attendees`

### 5.1 `meetings` 职责

保存一次会议的基本上下文。多个讨论点、决策和参与者使用关系实体表达，
不嵌入 JSON 或 UUID 数组。

### 5.2 `meetings` 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键及会议详情／来源标识 |
| `title` | `text` | 否 | 委员会成员输入 | 历史列表和详情识别 |
| `starts_at` | `timestamptz` | 否 | 委员会成员输入 | 同时保存会议日期与时间，并支持历史排序 |
| `summary` | `text` | 否 | 委员会成员输入 | 保存会议摘要；缺失时按既有验收拒绝提交 |
| `created_by` | `uuid` → `profiles.id` | 否 | 当前登录用户 | 会议创建责任追踪 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 创建时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近更新时间 |

### 5.3 `meeting_attendees` 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `meeting_id` | `uuid` → `meetings.id` | 否 | 会议表单 | 所属会议 |
| `profile_id` | `uuid` → `profiles.id` | 否 | 会议表单 | 参加会议的后台用户 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 关系建立时间 |

`meeting_id + profile_id` 作为候选复合主键／唯一键，最终键和删除行为在步骤
3–4 确认。P0 的“参与者”在会议语境中指委员会后台用户，不得与活动参与者
`participants` 混用。

## 6. `discussion_points`

### 6.1 职责

保存某会议中的多个有序讨论项，并允许任务精确追踪到讨论点来源。

### 6.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键和任务来源引用 |
| `meeting_id` | `uuid` → `meetings.id` | 否 | 当前会议 | 标识所属会议 |
| `content` | `text` | 否 | 委员会成员输入 | 保存讨论内容 |
| `position` | `integer` | 否 | 表单顺序 | 同一会议内稳定排序 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 创建时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近更新时间 |

`position` 使用零起始还是一日起始属于实现约定，不影响数据需求；步骤 4 只需
固定一种并禁止负数和同会议重复位置。

## 7. `meeting_decisions`

### 7.1 职责

保存某会议中的多个有序关键决策，并允许任务精确追踪到决策来源。

### 7.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键和任务来源引用 |
| `meeting_id` | `uuid` → `meetings.id` | 否 | 当前会议 | 标识所属会议 |
| `content` | `text` | 否 | 委员会成员输入 | 保存决策内容 |
| `position` | `integer` | 否 | 表单顺序 | 同一会议内稳定排序 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 创建时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近更新时间 |

### 7.3 转任务状态

计划要求定义“转任务状态”，但该状态不新增可编辑列。页面需要的
`has_source_task`／“已转任务”是派生结果：存在 `tasks.source_decision_id`
指向当前决策时为真，否则为假。这样不会出现布尔标记为真但没有任务，或
任务已存在但标记仍为假的双重事实。

## 8. `tasks`

### 8.1 职责

保存独立任务或从会议讨论点／决策转换而来的任务。每条任务只有一个主要
负责人，最多关联一个活动。

### 8.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键 |
| `title` | `text` | 否 | 委员会成员输入 | 列表和详情识别 |
| `description` | `text` | 否 | 委员会成员输入 | 说明行动内容；符合转换验收输入 |
| `assignee_id` | `uuid` → `profiles.id` | 否 | 委员会成员选择 | 单一主要负责人、本人任务和筛选 |
| `due_date` | `date` | 否 | 委员会成员输入 | 到期、临期和逾期计算 |
| `status` | `task_status` | 否 | `Not Started` | 持久化任务生命周期 |
| `source_meeting_id` | `uuid` → `meetings.id` | 是 | 可信服务端从来源写入 | 来源任务返回会议；独立任务为空 |
| `source_decision_id` | `uuid` → `meeting_decisions.id` | 是 | 可信服务端从来源写入 | 决策来源；其他任务为空 |
| `source_discussion_point_id` | `uuid` → `discussion_points.id` | 是 | 可信服务端从来源写入 | 讨论点来源；其他任务为空 |
| `event_id` | `uuid` → `events.id` | 是 | 委员会成员选择 | 可选活动关联、筛选和筹备进度 |
| `created_by` | `uuid` → `profiles.id` | 否 | 当前登录用户 | 创建责任追踪 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 创建时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近更新时间 |

### 8.3 派生字段与条件关系

- `Overdue`、`Due soon` 不落库；由 `due_date`、`status` 和 Sydney 当前日期
  计算；
- 独立任务的三个来源字段均为空；
- 来源任务的 `source_meeting_id` 必须有值，并且具体来源最多是决策或讨论点
  其中一个；
- 具体来源必须属于 `source_meeting_id` 指向的会议；该跨表一致性在步骤 4
  分配给数据库／服务端保证；
- 来源字段不在普通任务编辑表单中任意修改。

## 9. `events` 与 `event_check_in_tokens`

### 9.1 `events` 职责

保存周常活动或比赛的业务资料、签到窗口和是否需要学号的最小收集规则。

### 9.2 `events` 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键及任务／报名／签到关系目标 |
| `event_type` | `event_type` | 否 | 委员会成员选择 | `Weekly Session` 或 `Tournament` |
| `name` | `text` | 否 | 委员会成员输入 | 活动列表、详情和 token 页最小展示 |
| `starts_at` | `timestamptz` | 否 | 委员会成员输入 | 活动日期时间和近期活动查询 |
| `location` | `text` | 否 | 委员会成员输入 | 活动地点和 token 页最小展示 |
| `description` | `text` | 否 | 委员会成员输入 | 活动说明 |
| `status` | `event_status` | 否 | 步骤 4 确认 | 活动生命周期和页面显示 |
| `check_in_opens_at` | `timestamptz` | 是 | 委员会成员／授权人员设置 | 签到启用时的窗口开始 |
| `check_in_closes_at` | `timestamptz` | 是 | 委员会成员／授权人员设置 | 签到启用时的窗口结束 |
| `requires_student_id` | `boolean` | 否 | `false` | 仅在活动确需 Monash／MSA 证明时收集学号 |
| `created_by` | `uuid` → `profiles.id` | 否 | 当前登录用户 | 创建责任追踪 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 创建时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近更新时间 |

两个窗口字段必须同时为空或同时有值，且关闭时间晚于开启时间；具体检查约束
留给步骤 4。活动没有 P0 的永久删除字段。是否提供归档由已批准范围决定，
当前不额外加入 `archived_at`。

### 9.3 `event_check_in_tokens` 职责

保存活动签到入口的不可逆摘要和撤销元数据。明文 token 仅在生成时交给可信
服务端构造 URL／QR，不写数据库、不进入普通活动响应。

### 9.4 `event_check_in_tokens` 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 内部主键 |
| `event_id` | `uuid` → `events.id` | 否 | 当前活动 | 将 token 绑定到唯一活动 |
| `token_digest` | `text` | 否 | 可信服务端生成 | 验证提交 token；禁止保存明文 |
| `created_by` | `uuid` → `profiles.id` | 否 | 当前授权用户 | 生成责任追踪 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 生成时间 |
| `revoked_at` | `timestamptz` | 是 | 撤销时由可信服务端写入 | 使旧入口失效并支持轮换 |

签到窗口属于活动，token 记录不重复保存窗口。一个活动允许多少个历史 token、
如何选择唯一有效 token 以及摘要算法属于步骤 4 的约束与安全规则。

## 10. `participants`

### 10.1 职责

只保存跨活动识别和现场确认所需的最小参与者资料，不承担完整会员档案职责。

### 10.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 内部主键；不向参与者显示 |
| `full_name` | `text` | 否 | 授权人员代录 | 现场身份确认；保存前去除多余空白 |
| `email` | `text` | 否 | 授权人员代录 | 身份匹配和防重复；保存前标准化大小写 |
| `student_id` | `text` | 是 | 活动确需证明时录入 | 条件性身份／资助证明；普通活动留空 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 建立时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近更正时间 |

本表不包含电话、生日、住址、付款资料、紧急联系人、营销用途或晚餐资格。
参与者去重键、邮箱大小写规则和学号格式留给步骤 4。

## 11. `registrations`

### 11.1 职责

保存参与者对某活动的报名事实。报名与签到严格分离，`Registered` 不表示
已经到场。

### 11.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键 |
| `event_id` | `uuid` → `events.id` | 否 | 授权报名操作 | 所属活动 |
| `participant_id` | `uuid` → `participants.id` | 否 | 参与者匹配结果 | 报名主体 |
| `registration_status` | `registration_status` | 否 | `Registered` | `Registered`／`Cancelled` 报名状态 |
| `registered_at` | `timestamptz` | 否 | 数据库当前时刻 | 首次报名时间；取消／恢复不覆盖 |
| `privacy_notice_acknowledged_at` | `timestamptz` | 是 | 自助报名时由服务端写入 | P0 授权代录可空；未来启用自助报名时条件必需 |
| `recorded_by` | `uuid` → `profiles.id` | 否 | 当前授权用户 | P0 授权代录责任追踪 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 记录创建时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 状态最近更新时间 |

P0 所有报名均由授权人员代录，因此 `recorded_by` 不允许为空。未来若正式批准
公开自助报名，再通过独立 migration 评估是否调整该字段；本轮不为 P1 预留
匿名写入。`privacy_notice_acknowledged_at` 仍按企划书保留为可空条件字段，
但不因此增加公开报名页面。同活动同参与者的唯一性在步骤 4 定义。

## 12. `attendance_records`

### 12.1 职责

保存参与者对某活动的唯一签到事实、记录方式和当前确认状态，为签到明细与
晚餐资格推导提供唯一事实来源。

### 12.2 字段

| 字段 | 类型方向 | 允许为空 | 默认／来源 | 用途 |
|---|---|---:|---|---|
| `id` | `uuid` | 否 | 数据库生成 | 主键 |
| `event_id` | `uuid` → `events.id` | 否 | token 或人工操作上下文 | 所属活动 |
| `participant_id` | `uuid` → `participants.id` | 否 | 安全身份匹配结果 | 签到主体 |
| `checked_in_at` | `timestamptz` | 否 | 可信服务端／数据库时钟 | 实际签到时刻 |
| `check_in_method` | `check_in_method` | 否 | 可信服务端 | `QR` 或 `Manual` |
| `attendance_status` | `attendance_status` | 否 | `Confirmed` 方向 | 表达当前签到是否仍有效，支持非破坏性更正 |
| `recorded_by` | `uuid` → `profiles.id` | 是／条件 | 当前授权用户 | 人工补签或任何人工更正时必需；未经更正的 QR 签到为空 |
| `created_at` | `timestamptz` | 否 | 数据库当前时刻 | 签到记录建立时间 |
| `updated_at` | `timestamptz` | 否 | 数据库维护 | 最近人工更正时间 |

### 12.3 更正与资格说明

- `attendance_status` 的最终允许值和状态转换在步骤 4 固定；最低需要表达
  “当前确认有效”和“已由授权人员撤销／更正为无效”；
- 不通过删除签到行纠错，以便保留 `recorded_by` 和 `updated_at`；
- 同活动同参与者仍只有一条签到记录；人工补签更新或创建这条唯一记录；
- 晚餐资格不设字段、不设表：只有当前活动中 `attendance_status` 为确认有效
  的记录才派生 `Eligible`，其他情况派生 `Not Eligible Yet`；
- 若 QR 记录之后被人工更正，`check_in_method` 仍表示首次记录来源，
  `recorded_by` 表示最近人工干预者。若团队需要完整多次更正历史，应进入 P1
  审计日志，不在本轮扩展。

## 13. 不建立的字段和实体

| 不建立内容 | 原因／替代事实 |
|---|---|
| `meeting_decisions.converted_to_task` 可编辑布尔值 | 从 `tasks.source_decision_id` 是否存在派生 |
| `tasks.is_overdue`、`tasks.is_due_soon` | 从 `due_date`、`status` 和 Sydney 当前日期派生 |
| `dinner_eligibility` 表或参与者资格字段 | 从当前有效 `attendance_records` 派生 |
| 报名记录中的 `attended` | 报名与签到是两个独立事实 |
| `events.registration_count`、`attendance_count`、`progress_percent` | 从关系表和任务状态聚合 |
| 明文 `check_in_token` | 只保存不可逆摘要，明文不落库 |
| 参与者电话、生日、住址、付款、紧急联系人 | 没有 P0 业务用途，且违反最小化基线 |
| 多负责人／任务参与者表 | P0 每项任务仅一个主要负责人 |
| 通知、营销、导出或完整审计日志表 | P1／Post-MVP，不扩大本轮范围 |

## 14. 字段完整性与可空性审计

| P0 数据要求 | 承载实体／字段 | 可空性结果 |
|---|---|---|
| 后台用户标识、显示名、角色 | `profiles.id/display_name/committee_role` | 均不可空 |
| 会议标题、日期时间、参与者、摘要、创建者 | `meetings` + `meeting_attendees` | 主字段不可空；至少一名参与者由步骤 4 保证 |
| 有序讨论点 | `discussion_points.meeting_id/content/position` | 均不可空 |
| 有序决策与转任务状态 | `meeting_decisions` + 来源任务派生 | 存储字段不可空；状态不落库 |
| 任务标题、描述、负责人、截止日期、状态 | `tasks` 对应字段 | 均不可空 |
| 任务来源 | 三个来源字段 | 独立任务可全空；来源任务按条件必需 |
| 任务关联活动 | `tasks.event_id` | 可空 |
| 活动类型、名称、时间、地点、说明、状态 | `events` 对应字段 | 均不可空 |
| 签到窗口 | `events.check_in_opens_at/closes_at` | 可同时为空；启用时同时必需 |
| 最小参与者资料 | `participants` | `student_id` 条件性可空；其余不可空 |
| 报名活动、参与者、状态和时间 | `registrations` | 均不可空；隐私确认按路径可空 |
| 签到活动、参与者、时间、方式、修正者 | `attendance_records` | 主事实不可空；`recorded_by` 条件性可空 |
| 创建／更新时间 | 各可变业务实体 | 均不可空并由数据库维护 |

## 15. 交给步骤 3–4 的明确输入

1. 在 ERD 中连接 11 个实体，并标明所有必需／可空关系；
2. 为 `meeting_attendees` 确定复合主键和会议删除行为；
3. 为会议子项、任务来源、活动关联、报名和签到确定外键删除／保留行为；
4. 固定 `committee_role`、`task_status`、`event_type`、`event_status`、
   `registration_status`、`check_in_method` 和 `attendance_status` 的允许值；
5. 定义同会议 position、同活动参与者报名、同活动参与者签到和有效 token 的
   唯一性规则；
6. 定义来源决策／讨论点必须属于来源会议、签到窗口完整性、条件性
   `recorded_by` 和 `student_id` 的数据库／服务端控制位置；
7. 确认 token 摘要算法、轮换、撤销和重复提交幂等规则；
8. 数据保留期限仍需 Stakeholder 在上线前确认，不在字段默认值中承诺永久
   保存。

## 16. 步骤 2 完成检查

- [x] `profiles` 已定义用户标识、显示名和委员会角色；
- [x] `meetings` 与 `meeting_attendees` 已定义标题、时间、参与者、摘要和创建者；
- [x] `discussion_points` 已定义所属会议、内容和顺序；
- [x] `meeting_decisions` 已定义所属会议、内容、顺序和派生转任务状态；
- [x] `tasks` 已定义标题、描述、单一负责人、截止日期、状态、来源和活动；
- [x] `events` 已定义类型、名称、时间、地点、说明、签到窗口和状态；
- [x] `participants` 已限制为最少必要的参与者标识与显示信息；
- [x] `registrations` 已定义活动、参与者、报名状态和条件性隐私确认；
- [x] `attendance_records` 已定义活动、参与者、签到时间、方式、状态和修正者；
- [x] 所有可变实体均包含创建／更新时间及必要责任追踪字段；
- [x] 每个字段均有用途、类型方向和可空性说明；
- [x] 未建立无 P0 用途的个人字段、派生事实或 P1 功能实体。
