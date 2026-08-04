# 第 3 天步骤 4：数据约束、状态与派生规则

> 所属计划：[第 3 天：数据库、权限与隐私设计](../../DAY_3_DATA_SECURITY_AND_PRIVACY.md)
> ERD 输入：[步骤 3：数据库 ERD 与关系说明](DAY_3_STEP_3_DATABASE_ERD.md)
> 字段输入：[步骤 2：核心实体说明与字段草案](DAY_3_STEP_2_CORE_ENTITIES_AND_FIELDS.md)
> 验收依据：[第 1 天 P0 用户故事与验收矩阵](../day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md)
> 流程依据：[第 2 天 P0 核心用户流程](../day-2/DAY_2_STEP_6_CORE_USER_FLOWS.md)
> 执行日期：2026-08-04
> 状态：步骤 4 完成；权限策略在步骤 5、字段隐私分级在步骤 6 完成

## 1. 执行结论

已把步骤 2–3 的实体与关系转换为可实施、可测试的数据规则，并为每条规则
指定数据库、可信服务端或两者共同承担的控制位置。

本步骤固定了：

- 角色、任务、活动、报名、签到方式和签到有效状态的有限值；
- 任务来源互斥、单一来源转换、单一负责人和单一活动关系；
- 报名、签到、会议参与者和子项顺序的唯一性；
- 活动 token 的随机性、摘要存储、活动绑定、轮换、撤销和窗口校验；
- 重复／并发报名、来源转换和签到的幂等结果；
- `Overdue`、`Due soon`、活动进度、聚合人数、转任务状态和晚餐资格的统一
  计算规则；
- 参与者字段规范化、条件性学号和人工更正责任规则。

`Overdue`、晚餐资格、活动进度和聚合人数均不作为可编辑事实保存。隐藏按钮
不属于本步骤的安全控制；敏感访问必须继续由步骤 5 的服务端鉴权与 RLS 保证。

## 2. 控制层职责

| 控制层 | 必须承担的职责 | 不得单独承担的职责 |
|---|---|---|
| 前端 | 即时字段提示、禁用重复点击、显示安全反馈 | 唯一性、权限、token 有效性或最终业务完整性 |
| 可信服务端 | 会话与角色校验、输入规范化、跨表业务校验、事务、幂等响应、token 生成与安全错误映射 | 绕过数据库唯一／外键约束，以“先查后写”代替并发保护 |
| PostgreSQL | 主键、外键、非空、唯一、有限值、检查约束、数据库触发器／函数和原子写入 | 把原始 SQL 错误、内部 ID 或敏感行直接返回客户端 |
| RLS | 限制直接表访问的可见行和允许操作 | 替代服务端对 token、窗口、输入和业务上下文的校验 |

下文使用 `DB`、`Server`、`Both` 标记主要控制位置。`Both` 表示服务端先给出
可理解的业务反馈，数据库仍作为绕过和并发条件下的最终防线。

## 3. 有限状态与标准值

数据库保存稳定的 snake_case 值，界面负责映射为已批准的显示文案。不得把
未知字符串直接写入状态列。

### 3.1 状态字典

| 类型 | 数据库允许值 | 界面文案 | 默认值 | 规则 |
|---|---|---|---|---|
| `committee_role` | `committee`, `authorised` | Committee, Secretary / Authorised | 无自动默认；受控账号流程指定 | 用户不能自行修改；`secretary` 是获得 `authorised` 能力的业务身份，不建立第三权限层 |
| `task_status` | `not_started`, `in_progress`, `completed` | Not Started, In Progress, Completed | `not_started` | `overdue` 和 `due_soon` 禁止写入 |
| `event_type` | `weekly_session`, `tournament` | Weekly Session, Tournament | 无；创建时必填 | 不接受自定义类型 |
| `event_status` | `scheduled`, `completed`, `cancelled` | Scheduled, Completed, Cancelled | `scheduled` | 只有 `scheduled` 活动允许 QR 签到；历史状态仍可读取 |
| `registration_status` | `registered`, `cancelled` | Registered, Cancelled | `registered` | 取消／恢复更新同一报名行 |
| `check_in_method` | `qr`, `manual` | QR, Manual | 无；可信路径指定 | 记录首次签到来源，不由参与者任意提交 |
| `attendance_status` | `confirmed`, `voided` | Confirmed, Voided | `confirmed` | QR 只能创建 confirmed；void／恢复仅授权人工操作 |

### 3.2 状态转换

| 资源 | 允许转换 | 禁止／处理 |
|---|---|---|
| 任务 | 三个持久化状态之间由委员会成员更新 | 任何未知值拒绝；完成任务自动退出待办、临期和逾期结果 |
| 活动 | `scheduled → completed/cancelled`；授权更正可将错误状态恢复为 `scheduled` | 非 `scheduled` 活动拒绝新的 QR 签到；已有签到和报名不因状态变化删除 |
| 报名 | `registered ↔ cancelled` | 不插入第二条报名；状态变化不自动创建、删除或修改签到 |
| 签到 | `confirmed ↔ voided` 仅授权人工操作 | QR 重复提交不能恢复 voided 记录；参与者需联系授权人员 |

状态约束由 `DB` 保证，状态转换授权和安全反馈由 `Server + RLS` 保证。

## 4. 通用字段与规范化约束

### 4.1 主键、时间与文本

| ID | 规则 | 控制位置 |
|---|---|---|
| GEN-01 | `profiles.id` 必须等于有效 `auth.users.id`；其余单列业务主键由数据库生成随机 UUID | DB |
| GEN-02 | `meeting_attendees` 使用 (`meeting_id`, `profile_id`) 复合主键 | DB |
| GEN-03 | `created_at` 插入时由数据库生成，之后不可由普通业务更新改写 | DB + Server |
| GEN-04 | `updated_at` 插入时生成，并在实际业务更新时由统一数据库触发器刷新 | DB |
| GEN-05 | 所有必填 `text` 保存 `btrim` 后不得为空字符串 | Both |
| GEN-06 | 客户端不得提交 `created_by`、`recorded_by` 或审计时间覆盖当前会话／系统值 | Server + RLS |

### 4.2 长度与格式基线

| 字段组 | 保存规则 | 上限方向 | 控制位置 |
|---|---|---:|---|
| `display_name`, `full_name` | 去首尾空白，内部连续空白折叠为一个空格 | 120 字符 | Both |
| `email` | 去空白并转小写；必须含单个有效域分隔结构，完整格式由服务端验证 | 254 字符 | Both |
| `student_id` | 去空白；为空时存 `NULL` 而不是空字符串 | 32 字符 | Both |
| 会议／任务标题、活动名称 | 去空白且非空 | 200 字符 | Both |
| 活动地点 | 去空白且非空 | 300 字符 | Both |
| 讨论点／决策内容 | 去空白且非空 | 5,000 字符 | Both |
| 摘要／描述 | 去空白且非空 | 10,000 字符 | Both |

数据库不使用过度严格的电子邮件正则表达式；它保证小写、非空、长度和基本
结构，服务端负责可理解的格式错误。`participants.email` 建立唯一索引，保证
标准化后每个邮箱只有一个参与者主记录。`student_id` 非空时建立部分唯一索引，
防止同一学号对应多个主记录。

## 5. 会议、讨论点和决策规则

| ID | 规则 | 数据库实现方向 | 控制位置 |
|---|---|---|---|
| MEET-C01 | 新建会议必须有标题、时间、摘要、创建者 | `NOT NULL` + 非空文本检查 | Both |
| MEET-C02 | 保存事务结束时会议至少有一条 `meeting_attendees` | 服务端原子保存并在提交前检查；集成测试覆盖 | Server |
| MEET-C03 | 同一后台用户不能在同一会议重复出现 | `meeting_attendees` 复合主键 | DB |
| MEET-C04 | 讨论点 `position >= 0`，同一会议 position 唯一 | `CHECK` + `UNIQUE(meeting_id, position)` | DB |
| MEET-C05 | 决策 `position >= 0`，同一会议 position 唯一 | `CHECK` + `UNIQUE(meeting_id, position)` | DB |
| MEET-C06 | 会议及子项在一个事务中保存；失败不得留下半成品 | transaction | Server + DB |
| MEET-C07 | 已被任务引用的会议、讨论点或决策不得删除 | 步骤 3 的 `RESTRICT` 外键 | DB |

P0 不提供永久删除。调整讨论点／决策顺序时，服务端必须在同一事务中使用无
冲突的临时排序或批量更新策略，避免逐行交换触发唯一约束失败。

## 6. 任务来源、负责人和活动规则

### 6.1 来源结构

| ID | 规则 | 数据库实现方向 | 控制位置 |
|---|---|---|---|
| TASK-C01 | 每个任务恰好一个 `assignee_id` 和一个 `created_by` | `NOT NULL` + FK | DB |
| TASK-C02 | 每个任务最多一个活动 | 单值可空 `event_id` FK | DB |
| TASK-C03 | 独立任务的三个来源字段全部为空 | 来源组合 `CHECK`／触发器 | Both |
| TASK-C04 | 来源任务必须有 `source_meeting_id` | `CHECK` | DB |
| TASK-C05 | `source_decision_id` 与 `source_discussion_point_id` 最多一个非空 | `CHECK (num_nonnulls(...) <= 1)` 或等价表达式 | DB |
| TASK-C06 | 具体来源非空时，其所属 `meeting_id` 必须等于 `source_meeting_id` | 约束触发器／可信数据库函数 | Both |
| TASK-C07 | 一个决策在 P0 中最多生成一个来源任务 | `UNIQUE(source_decision_id) WHERE source_decision_id IS NOT NULL` | DB |
| TASK-C08 | 一个讨论点在 P0 中最多生成一个来源任务 | `UNIQUE(source_discussion_point_id) WHERE source_discussion_point_id IS NOT NULL` | DB |
| TASK-C09 | 来源字段创建后不由普通任务编辑表单修改 | 服务端白名单更新 + RLS | Server + RLS |

TASK-C07／08 是 FL-03 “重复请求返回同一成功结果，不创建第二条任务”的最终
并发防线。若未来确认一个决策需要多个行动项，应作为范围变更，以显式转换
记录或幂等键替换该规则；P0 不预留未批准的多任务行为。

### 6.2 转换事务与幂等结果

1. 服务端重新读取并授权来源会议和具体来源，不能信任隐藏字段；
2. 验证具体来源属于会议，并验证任务字段；
3. 在事务中尝试创建任务；
4. 若来源唯一约束冲突，读取当前会话有权查看的既有来源任务并返回同一成功
   结果；
5. 其他数据库错误回滚，不保留无来源任务或孤立关系；
6. 响应不把约束名、SQL 或不可访问的任务 ID 暴露给客户端。

### 6.3 任务状态和日期

| ID | 规则 | 控制位置 |
|---|---|---|
| TASK-C10 | `status` 只允许步骤 3.1 的三个值，默认 `not_started` | DB |
| TASK-C11 | `due_date` 必填；允许历史日期，以支持录入已逾期任务 | DB + Server |
| TASK-C12 | `overdue` 和 `due_soon` 不得作为列、状态或客户端可写字段 | Schema review + Server |

## 7. 活动与签到窗口规则

| ID | 规则 | 数据库实现方向 | 控制位置 |
|---|---|---|---|
| EVENT-C01 | 类型只允许 `weekly_session`、`tournament` | enum／`CHECK` | DB |
| EVENT-C02 | 状态只允许 `scheduled`、`completed`、`cancelled` | enum／`CHECK` | DB |
| EVENT-C03 | 名称、开始时间、地点、描述、状态和创建者必填 | `NOT NULL` + 文本检查 | Both |
| EVENT-C04 | `check_in_opens_at` 与 `check_in_closes_at` 必须同时为空或同时非空 | `CHECK` | DB |
| EVENT-C05 | 窗口启用时 `check_in_opens_at < check_in_closes_at` | `CHECK` | DB |
| EVENT-C06 | QR 提交有效区间为 `opens_at <= now < closes_at` | 服务端与数据库函数使用同一绝对时刻 | Both |
| EVENT-C07 | 只有 `scheduled` 活动允许新 QR 签到 | 可信签到函数／事务校验 | Both |
| EVENT-C08 | 修改活动日期或状态不得删除任务、报名、签到或 token 历史 | FK + 普通更新 | DB |
| EVENT-C09 | `requires_student_id` 默认 `false` | `NOT NULL DEFAULT false` | DB |

所有时间以 `timestamptz` 比较。界面使用 `Australia/Sydney` 显示，但不得把
浏览器本地时钟作为签到有效性的权威来源。

## 8. 参与者与报名规则

### 8.1 参与者主记录

| ID | 规则 | 数据库实现方向 | 控制位置 |
|---|---|---|---|
| PART-C01 | `full_name`、标准化 `email` 必填；`student_id` 条件可空 | `NOT NULL` + 文本检查 | Both |
| PART-C02 | 标准化 email 全局唯一 | `UNIQUE(email)` | DB |
| PART-C03 | 非空 student ID 全局唯一 | 部分 `UNIQUE(student_id) WHERE student_id IS NOT NULL` | DB |
| PART-C04 | 不接受电话、生日、住址、付款或紧急联系人字段 | schema 白名单 | Server + Schema review |

### 8.2 报名

| ID | 规则 | 数据库实现方向 | 控制位置 |
|---|---|---|---|
| REG-C01 | 同活动同参与者只有一条报名 | `UNIQUE(event_id, participant_id)` | DB |
| REG-C02 | 状态只允许 `registered`、`cancelled`，默认 `registered` | enum／`CHECK` + default | DB |
| REG-C03 | P0 `recorded_by` 必填并从当前授权会话取得 | `NOT NULL` + FK；服务端赋值 | Both |
| REG-C04 | 授权代录时 `privacy_notice_acknowledged_at` 可空 | nullable | DB |
| REG-C05 | 若活动 `requires_student_id = true`，报名参与者必须已有非空 student ID | 约束触发器／可信数据库函数 + 服务端提示 | Both |
| REG-C06 | 取消或恢复报名更新原行，不插入第二行，不改变 `registered_at` | 唯一约束 + 更新白名单 | Both |
| REG-C07 | 报名创建／更新不创建、删除或修改签到 | 无报名→签到触发器；分离事务 | DB + Server |

重复／并发报名时，数据库唯一约束决定最终只有一行。服务端在有权限的前提下
读取该行并返回当前报名状态；不得把重复错误映射成第二条记录。

## 9. 签到、人工更正与晚餐资格规则

### 9.1 签到事实

| ID | 规则 | 数据库实现方向 | 控制位置 |
|---|---|---|---|
| ATT-C01 | 同活动同参与者只有一条签到 | `UNIQUE(event_id, participant_id)` | DB |
| ATT-C02 | `checked_in_at` 由可信服务端／数据库时钟生成，参与者不能自报 | default／可信函数 | Both |
| ATT-C03 | 方法只允许 `qr`、`manual`；状态只允许 `confirmed`、`voided` | enum／`CHECK` | DB |
| ATT-C04 | `manual` 记录必须有 `recorded_by` | `CHECK(method <> 'manual' OR recorded_by IS NOT NULL)` | DB |
| ATT-C05 | `voided` 记录必须有 `recorded_by` | `CHECK(status <> 'voided' OR recorded_by IS NOT NULL)` | DB |
| ATT-C06 | QR 只能首次创建 `confirmed`；不能由匿名请求撤销或恢复 | 可信签到函数 + RLS | Server + RLS |
| ATT-C07 | 人工补签／更正在事务中更新唯一行，并刷新 `updated_at` 和 `recorded_by` | unique + trigger + 服务端 | Both |
| ATT-C08 | QR 签到要求同活动存在 `registered` 报名；人工路径可处理现场例外，但不自动创建报名 | 可信数据库函数／事务校验 | Both |

ATT-C08 将“有效参与者”具体化为当前活动已注册参与者。它仍保持报名和签到
为独立事实：注册只是 QR 写入的前置校验，不产生签到；授权人员仍可为现场
例外人工补签，且报名统计不被隐式改变。

### 9.2 重复和并发签到

1. 服务端不能仅“先查无记录再插入”；最终防线必须是
   `UNIQUE(event_id, participant_id)`；
2. 首次有效 QR 请求原子创建 `confirmed + qr` 记录；
3. 已有 `confirmed` 记录时返回安全的 “Already processed” 结果，不修改时间、
   方法或责任字段；
4. 已有 `voided` 记录时同样不允许 QR 恢复，返回联系现场授权人员的安全结果；
5. 两个并发请求中只允许一个插入成功，另一个按唯一冲突走幂等响应；
6. 响应不得泄露参与者是否存在、报名的其他字段或他人签到状态。

### 9.3 晚餐资格

| ID | 规则 | 控制位置 |
|---|---|---|
| DIN-C01 | 当前活动存在该参与者 `attendance_status = confirmed` 的唯一签到时，结果为 `Eligible` | DB query／view + Server |
| DIN-C02 | 无签到或签到为 `voided` 时，结果为 `Not Eligible Yet` | DB query／view + Server |
| DIN-C03 | 不建立资格表、资格列或资格更新接口 | Schema review + Server |
| DIN-C04 | 人工更正签到后，下一次查询必须从当前签到事实重新计算 | query invalidation + DB query | Both |

## 10. 活动 token 与受限签到规则

### 10.1 生成与存储

| ID | 规则 | 控制位置 |
|---|---|---|
| TOKEN-C01 | token secret 使用密码学安全随机数生成器产生至少 32 随机字节 | Server |
| TOKEN-C02 | URL token 采用不可预测 secret；可包含公开 token row ID 用于查找，但不能只依赖可猜测 event ID | Server |
| TOKEN-C03 | 数据库只保存 secret 的 SHA-256 摘要，不保存明文 URL token | Server + DB schema |
| TOKEN-C04 | `token_digest` 全局唯一，并符合固定摘要编码格式 | `UNIQUE` + 长度／格式检查 | DB |
| TOKEN-C05 | 一个活动最多一个 `revoked_at IS NULL` 的 active token | 部分 `UNIQUE(event_id) WHERE revoked_at IS NULL` | DB |
| TOKEN-C06 | 生成／轮换必须记录 `created_by`；轮换时先撤销旧 token，再创建新 token，整个过程原子执行 | transaction | Both |
| TOKEN-C07 | 明文 token 仅在生成成功响应中返回一次；遗失后只能轮换，不提供数据库反查 | Server |

摘要对高熵随机 secret 足以防止从数据库记录直接还原入口。应用日志、错误、
分析事件和截图不得记录完整 token。步骤 5 还需限制只有 authorised 用户可生成、
轮换或查看生成结果。

### 10.2 页面加载与最终提交校验

PG-03 首次加载与最终提交都必须重新执行以下校验，不能把首次加载成功视为
后续提交授权：

1. 解析 token row ID／secret，格式不正确则统一拒绝；
2. 读取对应 token 记录并对提交 secret 计算摘要，以恒定时间方式比较；
3. 验证 `revoked_at IS NULL`；
4. 验证 token 绑定的活动仍存在且 `status = scheduled`；
5. 验证活动同时配置有效窗口，且数据库权威时间满足
   `opens_at <= now < closes_at`；
6. 标准化参与者提交的 email，并在活动要求时同时校验 student ID；
7. 验证匹配参与者对同一活动存在 `registered` 报名；
8. 在同一可信事务中创建签到，依赖签到唯一约束解决并发；
9. 将无效格式、摘要不匹配、已撤销、非 scheduled、窗口无效、无匹配参与者、
   无有效报名统一映射为不枚举个人或内部状态的失败结果；
10. 对重复签到返回 “Already processed”，不返回名单、报名详情或资格。

为降低 token 和身份匹配接口的滥用，服务端还必须设置按来源与 token 的请求
速率限制和失败退避；具体平台实现留到签到功能开发，不改变数据库模型。

## 11. 派生与聚合规则

### 11.1 Sydney 日期基线

所有“今天”使用数据库／服务端权威时刻转换到 `Australia/Sydney` 后得到的
本地日期。自动化测试固定时钟，并覆盖夏令时期间；浏览器日期不作为最终判断。

| ID | 结果 | 精确定义 | 持久化 |
|---|---|---|---|
| DER-C01 | 本人任务 | `assignee_id = current_profile_id AND status <> completed` | 否 |
| DER-C02 | 全部待办 | `status <> completed` | 否 |
| DER-C03 | Overdue | `due_date < sydney_today AND status <> completed` | 否 |
| DER-C04 | Due soon | `sydney_today <= due_date <= sydney_today + 7 days AND status <> completed` | 否 |
| DER-C05 | 即将到来的活动 | `starts_at >= authoritative_now`，按 `starts_at ASC` | 否 |
| DER-C06 | 活动进度 | `completed linked tasks / all linked tasks`；无任务为 `0/0` | 否 |
| DER-C07 | 报名人数 | 当前活动 `registration_status = registered` 的行数 | 否 |
| DER-C08 | 签到人数 | 当前活动 `attendance_status = confirmed` 的行数 | 否 |
| DER-C09 | 决策／讨论点已转任务 | 存在对应非空来源外键的任务 | 否 |
| DER-C10 | 晚餐资格 | 按 DIN-C01／02 从当前活动签到事实推导 | 否 |

普通委员会读取 DER-C07／08 时，查询结果只允许包含活动 ID 和数字。不得在
同一 view、RPC 返回结构或序列化对象中包含 `participant_id`、姓名、邮箱、
学号、报名时间、签到时间或个人资格。

## 12. 约束实施矩阵

| 规则组 | 前端 | Server | DB constraint／transaction | RLS（步骤 5） |
|---|---|---|---|---|
| 必填、长度、格式 | 提示 | 规范化与错误映射 | 非空、长度、基本检查 | 防绕过写入 |
| 状态允许值 | 控件限制 | 白名单 | enum／`CHECK` | 限制谁能改 |
| 任务单一负责人／活动 | 单选控件 | 验证引用 | 单值 FK + 非空／可空 | 限制引用范围 |
| 任务来源一致性 | 只读来源 | 重读并验证 | check + constraint trigger + unique | 限制来源读取／写入 |
| 报名唯一性 | 禁用重复点击 | 幂等响应 | unique + transaction | authorised 写入 |
| 签到唯一性 | 禁用重复点击 | 幂等响应 | unique + transaction | 只允许可信入口／authorised |
| token／窗口 | 安全状态 | 完整重验、摘要、限速 | unique active token + 可信函数 | token 表默认拒绝 |
| 学号条件 | 条件字段提示 | 跨表验证 | trigger／可信函数 | 限制敏感字段 |
| 人工更正 | 授权 UI | 角色、原状态和目标状态验证 | conditional check + update transaction | authorised only |
| 派生统计／资格 | 只读展示 | 统一查询接口 | query／view，不设可写列 | 行与字段隔离 |

## 13. 负向场景与阻止位置

| 场景 | 数据库防线 | 服务端行为 | 预期结果 |
|---|---|---|---|
| 同一活动重复报名 | `(event_id, participant_id)` unique | 返回现有状态或执行明确状态更新 | 只有一条报名 |
| 同一活动重复／并发签到 | `(event_id, participant_id)` unique | 捕获冲突并返回安全幂等结果 | 只有一条签到 |
| 同一来源重复转换 | 来源字段部分 unique | 返回既有可访问任务 | 只有一条来源任务 |
| 任务同时引用决策和讨论点 | source `CHECK` | 提交前拒绝 | 不写入任务 |
| 来源属于另一会议 | constraint trigger | 重读来源并拒绝 | 不写入错误关系 |
| 无效／撤销／错误活动 token | active token 与绑定记录 | 统一失败，不枚举原因 | 不写签到 |
| 过早或过期签到 | 权威数据库时间校验 | 统一窗口失败 | 不写签到 |
| 无有效活动报名的 QR 请求 | 可信函数查询 | 统一失败 | 不写签到、不泄露参与者 |
| 普通委员会读个人明细 | 步骤 5 RLS | 服务端拒绝且不执行敏感查询 | 无敏感行返回 |
| 直接写 `Eligible`／`Overdue` | schema 无对应列 | 请求白名单拒绝 | 不产生第二事实 |
| 人工签到缺少操作者 | conditional `CHECK` + FK | 从会话注入操作者 | 无匿名人工更正 |

## 14. 对步骤 2–3 的一致性修正

为落实 FL-03 的重复转换幂等要求，本步骤将决策／讨论点与来源任务的基数从
“一个来源可产生多条任务”收紧为 P0 的“零或一条来源任务”。这不改变每条
任务最多一个具体来源的原规则，也不新增字段。步骤 3 ERD 已同步更新。

其他实体、字段、主键和删除行为无需变更。

## 15. 交给后续步骤的明确输入

1. 步骤 5 必须为所有资源定义 committee、authorised、token／匿名会话的
   select／insert／update／敏感操作权限；
2. token 表默认不得向客户端直接 select，token 验证只能走受限服务端入口；
3. 普通委员会聚合接口必须返回不含任何个人字段的固定结构；
4. 来源转换、报名、QR 签到和人工更正都需要正向、重复、并发、无权限和
   直接数据库访问测试；
5. 首次 migration 必须显式创建状态类型、主键、外键、唯一／部分唯一索引、
   检查约束、更新时间触发器和必要的可信函数／约束触发器；
6. `src/types/database.generated.ts` 必须在 migration 应用后重新生成；
7. 迁移回滚必须说明状态类型、函数、触发器和依赖表的逆序删除；
8. 参与者数据保留期限仍需 Stakeholder 在上线前确认。

## 16. 步骤 4 完成检查

- [x] 一条任务最多关联一个来源决策或讨论点，并最多关联一个活动；
- [x] 同活动同参与者的报名和签到分别有唯一性规则；
- [x] 任务只保存 Not Started、In Progress 和 Completed 三种语义状态；
- [x] Overdue 与 Due soon 的 Sydney 日期边界已固定且不落库；
- [x] 晚餐资格只从当前确认签到推导且不可编辑；
- [x] 活动 token 的生成、摘要、绑定、轮换、撤销和窗口规则已定义；
- [x] 重复转换、报名和签到均有数据库并发防线及服务端幂等结果；
- [x] 参与者字段规范化、条件学号和人工更正责任规则已定义；
- [x] 每项规则均标明数据库、服务端或两者共同控制的位置；
- [x] 重复报名、重复签到、无效 token 和越权读取均有明确阻止位置；
- [x] 未增加独立资格、外部通知、公开报名或其他 P1／Post-MVP 能力。
