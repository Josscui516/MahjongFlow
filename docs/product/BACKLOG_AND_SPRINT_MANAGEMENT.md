# Product Backlog、Sprint Backlog 与 User Story 管理基线

## 1. 当前结论

MahjongFlow 使用同一个
[GitHub Project #5](https://github.com/users/Josscui516/projects/5)
作为项目执行的单一视图入口。Product Backlog、Sprint Backlog 和 Kanban
不是三份互相复制的数据，而是同一批 GitHub Issues 的不同视图：

- `Product Backlog`：展示全部 40 个正式 P0 项，并按 `Backlog Rank` 升序排列；
- `Current Sprint`：按 `Sprint` 过滤当前承诺范围；
- `Kanban by Status`：按 `Status` 展示实际执行进度；
- `Priority Overview` 与 `Module Overview`：分别用于优先级和模块审查。

GitHub Issues 记录用户价值、验收条件、依赖和验证证据；Project 字段负责
排序、筛选、Sprint 承诺和状态展示。仓库文档仍是范围、权限、架构和长期
约定的权威来源。

## 2. Backlog 层级

```text
MVP scope
└── Epic (#1–#8)
    └── User Story 或 Enabler (#9–#37、#39–#41)
        └── 验收条件、依赖、验证方式与交付证据
```

- `Epic` 表示可由多个 Issue 共同完成的业务或基础能力；
- `User Story` 表示可独立验收的用户结果；
- `Enabler` 表示认证、权限、共享状态或数据维护等支撑多个故事的工程工作；
- `Bug` 保留给实现后发现的可复现缺陷，当前正式 Backlog 没有 Bug 项。

认证、UI 状态、权限、隐私和测试属于横切要求，不额外虚构业务 User Story。
它们应写入相关 User Story 的验收条件，或在确有独立交付结果时标记为
`Enabler`。

## 3. 六个规范 User Stories

| Story ID | User Story | Epic／实施 Issue |
|---|---|---|
| `US-01` | As a committee member, I want to save meeting discussions and decisions so that I can accurately review them after the meeting. | #2；#12–#14 |
| `US-02` | As a committee member, I want to convert a meeting decision directly into a task so that action items are not lost. | #3；#23–#25 |
| `US-03` | As a committee member, I want to quickly see my assigned, due-soon, and overdue tasks so that I can plan work and address risks. | #4；#15、#16、#20–#22 |
| `US-04` | As a committee member organising an event, I want to manage event details and preparation tasks together so that I can understand preparation progress. | #5；#17–#19 |
| `US-05` | As an authorised user, I want to distinguish registered participants from actual attendees so that participation records are accurate. | #6、#7；#26–#34 |
| `US-06` | As an authorised user, I want to verify dinner eligibility from confirmed attendance so that dinner is not issued incorrectly. | #8；#35–#37 |

Foundation 与共享支撑 Epic #1 以及 Enabler #9–#11、#39–#41 映射 `US-01–US-06`；
数据保留 Enabler #29 主要服务 `US-05`。每个实施 Issue 正文已包含正式
`User story` 或 `Backlog classification` 段落，原有验收与安全要求继续保留。

## 4. Project 字段

| 字段 | 用途 |
|---|---|
| `Status` | `Backlog → Ready → In Progress → Review → Testing → Done` |
| `Priority` | `P0`、`P1`、`Post-MVP` |
| `Module` | 业务／基础模块 |
| `Effort` | 相对工作量，不等同于小时 |
| `Dependencies` | 前置依赖摘要；原生 blocked-by 关系仍是可导航证据 |
| `Target Development Week` | 路线图预测周，可随重排调整 |
| `Backlog Rank` | Product Backlog 全局顺序 |
| `Story ID` | 追踪到六个规范 User Stories |
| `Item Type` | `Epic`、`User Story`、`Enabler`、`Bug` |
| `Sprint` | 团队已经明确承诺进入哪个 Sprint |
| `Acceptance Gate` | 从 Issue 的 Acceptance criteria checkbox 派生：`Not checked`、`Incomplete`、`Passed` |

`Target Development Week` 是预测，`Sprint` 是承诺，两者不可互相替代。
未完成 Sprint planning 的项目不预填未来 Sprint，以免把路线图错误表达为承诺。

## 5. 当前 Sprint Backlog

当前实施周期为 `Sprint 2`，目标是完成 M1：认证、角色、权限、共享状态与
数据基础，使 X-01–X-07 可以验收。当前 Sprint Backlog 只包含：

| Issue | 作用 | Assignee | 当前状态 |
|---|---|---|---|
| [#9 登录、登出、会话和受保护路由](https://github.com/Josscui516/MahjongFlow/issues/9) | WP-A 认证与会话 | `Josscui516` | Ready |
| [#10 两级角色、服务端授权与 RLS](https://github.com/Josscui516/MahjongFlow/issues/10) | #39／#40 上层协调 Enabler | `Josscui516` | Ready |
| [#39 Schema、约束、seed 和生成类型](https://github.com/Josscui516/MahjongFlow/issues/39) | WP-B Schema 与约束 | `Kaia-Zhang` | Ready |
| [#40 RLS policies 和服务端授权](https://github.com/Josscui516/MahjongFlow/issues/40) | WP-C RLS 与服务端授权 | `YUHAN2233` | Ready |
| [#11 共享 loading、empty、success 和 error 状态](https://github.com/Josscui516/MahjongFlow/issues/11) | WP-D 共享 UI | `Scarletthekiller` | Ready |
| [#41 M1 测试、质量和验收 harness](https://github.com/Josscui516/MahjongFlow/issues/41) | WP-E 测试与验收基础 | `Caiqwe123` | Ready |

这六个 Issue 已进入 Sprint 2。步骤 9 refinement 后，#9、#11、#40、#41 已满足
独立开始条件并进入 `Ready`；#39 的本地固定 Auth UUID fixture 已完成 reset 后同 UUID
重建验证；#10 已明确协调负责人并进入 `Ready`。实际开始实现时
才进入 `In Progress`。

## 6. 运作规则

1. Product Owner／团队按价值、风险和依赖维护 `Backlog Rank`；不得只按 Issue 编号排序。
2. Sprint planning 时从 Product Backlog 选择可完成范围并填写 `Sprint`；不复制或重建 Issue。
3. 每个 Sprint 必须有明确目标；加入范围前确认用户价值、验收条件、依赖、负责人和工作量。
4. 每名成员同时最多一个主要 Issue 处于 `In Progress`。
5. PR 可审查后进入 `Review`；非作者批准后进入 `Testing`；验收、检查、文档、合并和必要部署完成后才能进入 `Done`。
6. 范围、角色、权限、Schema 或架构变化必须先更新对应权威文档；新需求默认进入 Post-MVP Backlog。
7. Sprint 中途新增工作时，应记录原因并明确移入或移出项，避免静默扩大承诺范围。
8. `Backlog → Ready` 由团队在 refinement 后手动确认；其余状态由
   [GitHub Project 自动化](../operations/GITHUB_PROJECT_AUTOMATION.md) 按分支、PR、
   独立审查、CI、验收条件和 WIP 门禁推进，不得手动跳过中间状态。

## 7. 当前审计快照

截至 2026-08-07：Project 包含 8 个 Epic 和 32 个实施／支撑 Issue，共 40 项；
全部为 P0。步骤 9 补充验证后六项均为 `Ready`，其余项目保持 `Backlog`。
原先 #9–#37 对 `Josscui516` 的批量初始分配已清除；Sprint 2 的五个独立工作包
分别分配给 #9、#39、#40、#11、#41；#10 由 Joshua 负责上层协调，但不作为第六个个人工作包。
未来工作在进入对应 Sprint planning 前保持
未分配，避免把路线图预测误写成个人承诺。Acceptance Gate 已在 Product
Backlog、Current Sprint 和 Kanban 卡片中显示；8 个 Epic 因不使用该标题为
`Not checked`，32 个实施／支撑 Issue 当前均有未完成验收项，因此为 `Incomplete`。
