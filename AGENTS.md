# MahjongFlow 项目协作规则

## 规则层级与来源

本仓库的规则分为两层：

1. **通用工程规则**：适用于代码设计、依赖边界、验证、审查和可维护性，不依赖具体业务领域。
2. **MahjongFlow 项目规则**：适用于 MVP 范围、角色权限、参与者数据、Supabase、计划文档和 GitHub 协作。

发生冲突时，按以下优先级处理：用户对当前任务的明确要求 → 本 `AGENTS.md` → `docs/project/MVP_PROJECT_PROPOSAL.md` → 对应架构、安全、运维和计划文档 → 仓库内 skill。不得把来源项目 `zero_day_fraud` 的保险、零日实验、双语文档或 Linear 约定视为本仓库规则；蒸馏记录见 `docs/project/RULES_AND_SKILLS_DISTILLATION.md`。

实施前按任务读取权威文档：

| 任务范围 | 必读文档 |
|---|---|
| MVP 范围、角色、验收和排期 | `docs/project/MVP_PROJECT_PROPOSAL.md` |
| 仓库结构、模块边界和命名 | `docs/plans/week-1/artifacts/day-1/DAY_1_REPOSITORY_STRUCTURE_BASELINE.md` |
| Git、Issue、PR、Review 和 Testing | `docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md` |
| 数据库、migration 和回滚 | `docs/operations/DATABASE_MIGRATIONS.md` |
| 权限、参与者数据或 RLS | `docs/plans/week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md` 和相关安全文档 |
| 环境或部署 | `docs/operations/ENVIRONMENT_CONFIGURATION.md`、`docs/operations/VERCEL_DEPLOYMENT.md` |

## 通用工程实施规则

1. 采用“函数式核心、命令式边界”：验证、日期计算、状态推导、资格计算和数据转换尽量使用确定性的纯函数；网络、数据库、认证、时钟、随机性、日志和文件 I/O 留在显式边界。
2. 将 SOLID 作为设计和审查准则，而不是强制把所有逻辑改写为类。模块保持单一职责；优先使用组合、窄接口和显式依赖注入；只有存在真实可替换实现和稳定生命周期契约时才引入多态或继承。
3. 领域逻辑不得依赖 UI、路由或具体外部客户端。适配器可以返回结果，但不得通过隐藏全局状态修改领域对象。
4. 使用明确的 TypeScript 类型、输入校验和错误语义。不要以无界字典、服务定位器、全局可变注册表或过早的通用框架替代清晰契约。
5. 先实现当前 Issue 的最小可验收范围，再抽象复用。没有第二个真实用例时，不为假设中的未来需求扩展公共接口或框架。
6. 外部时间、随机数和第三方服务应可替换或注入，使关键逻辑可重复测试。跨实现的稳定端口应有契约测试；增量计算与完整重算并存时应验证结果等价。
7. 修改行为时覆盖成功、失败和边界路径；修复缺陷时优先添加能在修复前失败、修复后通过的回归测试。
8. 交付前检查职责泄漏、重复事实源、权限绕过、错误吞噬、隐式副作用、无关格式化和未记录假设。

## MahjongFlow 实现边界

1. P0、P1、Post-MVP、角色和验收基线以 `docs/project/MVP_PROJECT_PROPOSAL.md` 为准。新增能力默认进入 Post-MVP，除非有正式范围替换决定。
2. 普通委员会用户只能访问非敏感协调数据和安全聚合；参与者、报名、签到和晚餐资格明细只允许 `authorised` 角色访问。权限必须同时在适用的路由／UI、服务端入口和 Supabase RLS 执行。
3. Client Component 不得导入 server-only 模块、secret key 或完整敏感记录类型。所有写操作通过具备认证、授权、校验和安全错误映射的服务端入口。
4. 所有 schema、约束、函数、索引和 RLS 变更只通过 timestamped migration 实施；生成的数据库类型只通过工具重新生成，不手工修补。
5. UI 功能应按适用范围处理 loading、empty、success、validation error、permission denied、duplicate submission 和 system error 状态。
6. 日期、截止和临期逻辑使用 `Australia/Sydney` 语义，并对日期边界进行测试。
7. 编写或修改 Next.js 代码前，必须先读取当前安装版本在 `node_modules/next/dist/docs/` 中对应主题的文档，不依赖旧版本记忆。
8. 开发、测试、文档、截图和演示只使用虚构或匿名化数据，并遵守下方密钥与真实数据规则。

## GitHub Issues 与项目跟踪

GitHub Issues 和 GitHub Project 取代来源项目的 Linear 工作流。Issues 记录任务存在原因、负责人、状态、依赖、阻塞、验收和交接；本地 `README.md` 与 `docs/` 仍是长期范围、架构、权限、Schema 和运维约定的权威来源。

1. 当任务、分支、PR 或用户请求已关联 Issue 时，开始工作前读取 Issue 描述、评论、标签、负责人、依赖、验收条件和 Project 状态。
2. 创建 Issue 前先搜索等价项。一个 Issue 聚焦一个可独立验收的结果；能独立验收、排序、指派或延期的步骤使用独立 Issue 或 sub-issue，不能独立验收的内部步骤使用 checklist。
3. 普通讨论、未确认想法、同一任务内已修复的小问题、临时 QA 记录和不影响后续工作的提醒不创建 Issue。
4. 新需求默认标记为 Post-MVP；不得仅凭 Issue 内容改写已冻结的范围、角色权限、Schema 或架构。发生冲突时先记录并请求正式决定，再同步本地权威文档。
5. 使用仓库实际存在的标签和 Project 状态。只有开始已批准工作后才进入 `In Progress`；PR 可审查后进入 `Review`；非作者批准后进入 `Testing`；只有验收、检查、文档、合并及必要部署均满足后才进入 `Done`。
6. 阻塞记录必须包含原因、影响、已尝试操作、所需帮助、负责人、开始时间和下次检查时间；超过一个工作日后添加 `blocked` 标签或等效状态并升级。
7. Issue 应同步真实的分支、commit、PR、验证结果、阻塞和剩余风险，但不得复制完整 changelog。影响长期约定的决定必须回写本地权威文档。
8. 读取和分析 Issue 不代表有权创建、编辑、评论、关闭或改变 Project 状态。只有用户明确要求相应 GitHub 写操作时才能执行；批量创建、重构 Project、改负责人或跨仓库写入必须单独确认。
9. 无法访问正确仓库或 Project 时，报告缺失上下文，不得向猜测的仓库写入。

仓库内交付流程详见 `.agents/skills/project-delivery-workflow/SKILL.md`；实现与审查流程详见 `.agents/skills/mahjongflow-development/SKILL.md`。skills 细化步骤，但不扩大本文件授予的权限。

## Sprint 分支与两级 Pull Request

1. 每个 Sprint 使用一个从最新 `main` 创建的集成分支，命名为 `sprint/<sprint-number>-<short-kebab-theme>`。统一周计划必须写明 Sprint、集成分支、集成负责人、Sprint 总 PR 的主要 Issue 和纳入的工作包 Issues。
2. 成员 Issue 分支从本 Sprint 集成分支创建；成员 PR 的 base 必须是该 Sprint 集成分支，不得直接指向 `main`。
3. 成员 PR 只关联一个主要 Issue。完成个人验证、非作者审查和检查后合并到 Sprint 集成分支；对应 Issue 保持 `Testing`，不得因进入集成分支提前关闭或标记 `Done`。
4. Sprint 集成负责人在所有纳入工作包进入 `Testing` 后，使用 Sprint 集成分支向 `main` 创建唯一的 Sprint 总 PR。总 PR 仍只有一个主要集成／验收 Issue，并在 `Included work package issues` 中列出其余 Issues。
5. Sprint 总 PR 必须执行完整集成、回归、权限、隐私、migration 顺序和回滚检查。只有总 PR 的独立审查、必需 checks、所有 review threads 和全部纳入 Issue 验收均通过后，才可经用户明确授权合并到 `main`。
6. Sprint 总 PR 合并后，自动化才可将主要集成 Issue 与纳入的工作包 Issues 从 `Testing` 更新为 `Done` 并关闭。任何未达到 `Testing` 或 Acceptance Gate 未通过的 Issue 都会阻止 Sprint 完成。
7. `main` 只接收 Sprint 总 PR。紧急修复或仓库管理例外必须由用户明确批准，并记录为什么不能进入当前 Sprint 集成流程、验证和回退方式。
8. Codex 在任何分支、PR、review 或 merge 操作前必须核对统一周计划、成员工作文档、Issue 的 `Sprint` 字段、实际 base/head 和集成负责人。若缺少 GitHub Project 读取权限，应报告 Sprint 状态未知，不得凭文档声明代替实时核对。

### PR review 缺陷归属

审查 PR 时，先读取主要 Issue、成员工作文档、文件所有权、冻结输入／输出合同和完整 diff，再对每个发现分类：

1. **当前 PR 范围内缺陷**：本 PR 引入，且违反主要 Issue 验收条件、该成员输出合同、其文件所有权责任或造成直接回归。作为当前 PR 的阻塞问题，由当前作者修复。
2. **接口／集成缺陷**：若当前 PR 的输出违反冻结合同，由当前作者修复；若缺陷来自另一工作包的输出或已冻结合同本身，不要求当前作者越界修改，退回对应所有者／Issue，并在阻断集成时保持当前 PR 未合并。
3. **其他工作包或既有缺陷**：不属于当前主要 Issue，也不是本 PR 引入。除安全、数据丢失、权限绕过或全局构建阻断外，不阻塞当前 PR；经授权后记录到正确 Issue／backlog。
4. **范围或权威文档冲突**：Issue、周计划和权威文档互相冲突时暂停相关修改，请求团队决定并同步事实源，不得把范围变更藏进 review 修复。
5. **路由实现与路由保护必须分开归属**：拥有页面、layout 或导航的工作包负责实际 UI 路由实现；拥有认证 Issue 的工作包负责已冻结 URL namespace 的认证 guard、matcher、redirect 和匿名拒绝合同。审查认证 PR 时不得要求其作者实现另一工作包的页面，但可以要求保护机制覆盖计划中已冻结、即使尚未创建的路由。
6. **功能测试与验收基础必须分开归属**：每个功能 Issue 的作者负责证明自身验收条件所需的单元、集成、路由和回归测试；测试／验收工作包负责共享测试配置、跨工作包 acceptance harness、CI、fixture 基础和 Sprint 级证据。不得把功能自身的最低测试全部转给测试工作包，也不得要求功能作者实现属于验收工作包的共享 harness 或 CI。

每条阻塞意见必须说明归属依据、负责 Issue／所有者、是否阻止当前工作包 PR 或 Sprint 总 PR，以及复验方法。

## 统一周计划与成员周工作文档

未来添加或修改实施计划时，必须参考以下模板：

- 统一周计划模板：`docs/templates/WEEK_IMPLEMENTATION_PLAN_TEMPLATE.md`
- 成员周工作文档模板：`docs/templates/MEMBER_WEEKLY_WORK_PLAN_TEMPLATE.md`

从课程第 3 周（开发第 2 周）起，不再创建独立日计划。`docs/plans/week-1/` 中的日计划属于已经形成的历史执行记录，可以保留，但不得作为新计划的结构依据。

执行要求：

1. 每个开发周必须建立 1 份统一周计划和 5 份成员周工作文档。
2. 统一周计划存放在 `docs/plans/week-N/WEEK_N_IMPLEMENTATION_PLAN.md`。
3. 5 份成员文档存放在同一周目录中，并直接使用成员姓名的英文大写形式命名为 `{MEMBER_NAME}_WEEKLY_WORK_PLAN.md`，例如 `JOSHUA_WEEKLY_WORK_PLAN.md`。姓名必须使用团队确认的拼写；若未来出现同名成员，应先由团队确认唯一文件标识，不得自行追加含义不明的编号。
4. 统一周计划必须链接 5 份成员文档；每份成员文档只需链接所属统一周计划，以及确实存在直接依赖的成员文档，不要求链接或持续跟踪所有其他成员。
5. 统一周计划不按天分配任务，应按本周目标、5 个独立工作包、固定接口、文件所有权、少量集成检查点和最终验收组织。
6. 团队 5 人不设置长期固定职责，但每个成员在当前周独立拥有一个边界明确的工作包。周内不得随意介入、重写或扩大其他成员的工作包。
7. 每个工作包必须具备独立目标、专属主要文件范围、稳定输入合同、明确输出合同、个人验证方式和完成定义；能使用 mock、fixture 或类型合同独立推进时，不应等待其他成员的实现。
8. 计划应优先降低协作频率。默认只设置三个团队检查点：周初合同冻结、工作包完成后的单次集成、周末验收。只有接口变更、阻断或安全问题才增加临时同步。
9. 每个文件或目录必须有一个明确的本周所有者。其他成员不得并行修改该范围；如确需修改，应先由所有者确认并通过交接或单独变更完成，避免覆盖和冲突。
10. 每个工作包只由一名成员负责实现和自测。非作者审查仍按 Git 协作规范保留，但安排在交付物完成后集中进行一次，不要求持续结对、交叉实现或频繁复现。
11. 5 份成员文档的工作量应保持大致均衡，并显式写明独立范围、禁止修改范围、依赖输入、交付输出、唯一交接对象和接口变化处理方式。
12. 每名成员同时只能有一个主要 Issue 处于 `In Progress`；不得以协作或测试名义静默开始第二个主要任务。
13. 必须替换计划文档中的全部模板占位内容，不得在实际周计划或成员文档中保留 `{占位内容}`。
14. 统一周计划与每份成员文档必须包含明确的目标、开始条件、顺序执行步骤、文件所有权、交付物、验收标准、风险以及未完成项处理方式。
15. 执行步骤必须说明具体操作、产出、检查方法和最终交接条件，不能只写“协助开发”“参与测试”等无法验收的表述。
16. 计划内容必须遵循 `docs/project/MVP_PROJECT_PROPOSAL.md` 的范围、排期、权限和验收基线，不得自行扩大 MVP 范围。
17. 新增需求默认进入 Post-MVP Backlog，除非已经正式批准替换现有范围。
18. 创建、删除或移动计划文件后，必须检查所有 Markdown 相对链接是否有效。
19. New plans must be written in English while preserving the executable detail, evidence requirements, and low-coupling work-package structure defined here.

## Documentation language

1. All new repository documentation, plans, ADRs, handoffs, runbooks, templates, and newly added substantive sections must be written in English.
2. Existing Chinese historical records may remain in Chinese. Do not perform unrelated mass translation merely because a file is touched.
3. When an existing document is substantially rewritten or replaced, write the rewritten content in English. Small factual corrections may preserve the surrounding language to avoid a fragmented document.
4. Issue and Pull Request bodies created from repository templates must use English. Preserve exact code identifiers, commands, paths, schema names, and quoted external text in their original form.

## Codex Git 操作规范

Codex 在本仓库执行任何 Git 操作时，必须遵守[《Git 与团队协作约定》](docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md)。以下规则是面向 Codex 的强制执行摘要。

### 1. 操作授权边界

1. 修改工作区文件不自动授权创建分支、暂存、提交、推送、创建 Pull Request 或合并。
2. 只有用户明确要求对应 Git 操作时，Codex 才能执行该操作。
3. 不得把“完成实现”“修复问题”或“执行计划”解释为自动提交或推送授权。
4. 未经用户明确批准，不得强制推送、删除远程分支、合并 PR、改写已发布历史或修改远程分支保护。
5. 若任务缺少必需的 GitHub Issue 编号，不得虚构编号；需要创建分支、提交或 PR 时应先向用户取得编号或明确处理方式。

### 2. 操作前检查

每次准备创建分支、暂存、提交、推送或创建 PR 前，Codex 必须：

1. 运行 `git status --short`；
2. 确认当前分支、目标基线分支和远程仓库；
3. 检查工作区是否存在用户或其他成员的未提交改动；
4. 阅读与本次变更相关的 Issue、P0/P1/Post-MVP ID 和验收条件；
5. 确认不会覆盖、回退、暂存或提交不属于当前任务的改动；
6. 发现范围重叠或无法安全区分的改动时停止 Git 写操作并向用户说明。

禁止使用 `git reset --hard`、`git checkout -- <path>`、`git clean -fd` 或其他会丢失未提交工作的命令，除非用户明确要求且目标已经核实。

### 3. 分支流程

1. `main` 是可部署基线，只接收经批准的 Sprint 总 PR 或明确授权的例外；日常功能和修复不得直接在 `main` 上提交。
2. Codex 创建的分支统一使用：

   ```text
   codex/<issue-number>-<short-kebab-description>
   ```

3. 分支名必须包含真实 Issue 编号；描述使用小写英文与连字符。
4. 一个分支只解决一个主要 Issue，目标生命周期不超过两个工作日。
5. Sprint 集成分支基于预期的最新 `main`；成员 Issue 分支基于统一周计划指定的 Sprint 集成分支。Codex 不得默认把成员分支改为基于 `main`。
6. 打开成员 PR 前同步对应 Sprint 集成分支；打开 Sprint 总 PR 前同步 `main`。处理冲突时不得删除他人改动。
7. 不得对其他成员使用的共享分支强制推送。
8. 合并后只有在用户明确要求且确认分支已安全合并时，才可删除远程分支。

### 4. 暂存与提交

1. 暂存前检查完整 diff，并运行 `git diff --check`。
2. 只暂存当前任务明确涉及的文件，优先使用显式文件路径；不得为方便而使用会混入无关改动的 `git add .`。
3. 暂存后使用 `git diff --cached --check` 和 `git diff --cached` 复核提交内容。
4. 提交前运行与变更风险相称的 lint、typecheck、测试、构建或文档链接检查，并如实记录未运行项目及原因。
5. Commit 必须保持单一目的，格式为：

   ```text
   <type>: <imperative summary>
   ```

6. 允许的 type 为 `feat`、`fix`、`docs`、`test`、`refactor`、`chore`。
7. 摘要使用简洁英文祈使语气，不加句号。
8. 不得提交调试输出、临时文件、无关格式化、个人 IDE 配置或不属于当前任务的改动。
9. 提交完成后再次检查 `git status --short`，向用户说明提交内容、验证结果及仍存在的未提交改动。

### 5. Push 与 Pull Request

1. 只有用户明确要求时才可 push；push 前确认分支名、远程名和待推送 commits。
2. 默认禁止 `--force` 与 `--force-with-lease`；如确有必要，必须先说明原因、影响和替代方案并获得明确批准。
3. PR 必须关联 GitHub Issue，并列出对应 P0/P1/Post-MVP ID、Sprint、PR 类型和目标分支。成员 PR 只关联一个主要 Issue；Sprint 总 PR 以一个集成／验收 Issue 为主要 Issue，并单独列出纳入的工作包 Issues。
4. PR 描述必须包含：
   - 变更摘要与理由；
   - 验收场景及完成状态；
   - 实际运行的测试命令和结果；
   - 权限、隐私和敏感数据影响；
   - 数据库 migration、RLS、回滚和生成类型影响；
   - UI 的 loading、empty、success、error 状态，或不适用理由；
   - 风险与回退方式；
   - 使用虚构数据的必要截图或录屏。
5. PR 不得只有 Issue 链接或“已完成”等无法审查的描述。
6. 创建 PR 后必须报告 URL、PR 类型、Sprint、base/head、主要 Issue、纳入 Issues（如适用）、是否 Draft、已运行检查和待审查事项。
7. 成员 PR 的 base 必须为 `sprint/<number>-<theme>`；只有 Sprint 总 PR 或明确批准的例外可以使用 `main` 作为 base。

### 6. 审查、测试与合并

1. PR 作者必须先完成自查和相关测试。
2. 至少一名非作者成员批准后才能进入 `Testing`；Codex 不得把自己的检查视为团队批准。
3. 阻塞性审查意见必须解决；修复后重新运行受影响检查并请求复审。
4. 所有必需检查、验收场景和文档更新通过后才可合并到 `main`。
5. 涉及权限、敏感数据、数据库约束或核心回归测试的检查不得因排期跳过。
6. 合并属于独立的外部状态变更，必须有用户明确授权；创建 PR 的授权不自动包含合并授权。
7. 合并后检查 Issue、项目板、文档、部署和分支状态，再判断任务是否满足 Definition of Done。
8. Review 必须先按“PR review 缺陷归属”分类。不得要求作者为了通过当前 PR 而修改其他成员所有权范围，或把不属于当前 Issue 的普通缺陷静默并入。
9. 成员 PR 合并到 Sprint 分支后 Issue 保持 `Testing`；Sprint 总 PR 合并到 `main` 后才判断整组 Issues 是否进入 `Done`。

### 7. 数据库与权限变更

任何涉及数据库 schema、数据关系、Supabase Auth、RLS、参与者数据或签到 token 的变更必须包含：

1. timestamped SQL migration；
2. 外键、唯一约束、检查约束或索引说明；
3. 新增或修改的 RLS policy；
4. 普通委员会、授权人员和匿名会话的允许／拒绝测试；
5. migration 回滚说明，或不可逆时的备份和恢复步骤；
6. 对虚构 seed data、已有数据和部署顺序的影响；
7. 重新生成的 `src/types/database.generated.ts`。

禁止只在 Supabase Dashboard 手工修改远程 schema 或 policy。紧急远程修正必须补回 migration，并核对远程与仓库状态一致。

### 8. 密钥、配置和真实数据

Codex 不得把以下内容写入文件、commit、Issue、PR、测试日志、截图或聊天输出：

- `.env`、`.env.local`、`supabase/.env*` 的真实值；
- Supabase secret/service-role key、access token、密码或 session；
- 真实参与者姓名、邮箱、学号、报名、签到或晚餐资格；
- 未脱敏数据库 dump、生产日志、备份、截图或录屏。

只允许提交 `.env.example` 中的变量名和无效示例值。开发、测试、演示和文档只能使用虚构或匿名化数据。

发现疑似密钥或真实数据时，Codex 必须停止继续传播，不在回复中复述其值，并立即提醒用户进行撤销、轮换和暴露范围评估。只删除文件不代表凭据恢复安全。

### 9. WIP 与阻塞

1. 每名成员同时只能有一个主要 Issue 处于 `In Progress`；Codex 不得静默开始第二个主要任务。
2. 阻塞出现时立即记录原因、影响、已尝试操作、所需帮助、负责人、开始时间和下次检查时间。
3. 阻塞超过一个工作日，必须在 Issue/Project 标记 `blocked` 或等效字段并在团队同步中升级。
4. 无负责人、无下一次检查时间的阻塞不得静默顺延。
5. 未完成 Review 或 Testing 的任务不得标记为 `Done`。

### 10. Codex 标准 Git 执行顺序

在获得相应授权后，Codex 按以下顺序执行：

```text
检查 status、branch、remote、Sprint、统一周计划和 Issue
→ 确认范围、文件所有权、冻结合同、验收条件及工作树归属
→ 从指定 Sprint 集成分支创建 codex/<issue>-<description>
→ 实现并执行必要验证
→ 检查 diff 并显式暂存范围内文件
→ 复核 staged diff
→ 创建单一目的 commit
→ 再次检查工作树
→ 经明确授权 push
→ 经明确授权创建以 Sprint 分支为 base 的成员 PR
→ 按缺陷归属完成非作者审查并合并到 Sprint 分支，Issue 保持 Testing
→ 所有工作包进入 Testing 后创建 Sprint 总 PR 到 main
→ 完成整组验收并经明确授权合并 Sprint 总 PR
→ 更新整组 Issue、项目板、文档和部署状态
```

任一步骤缺少授权、Issue、验收条件、必要验证或安全前提时，Codex 应停在该步骤，说明缺失内容，不得跳过流程。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
