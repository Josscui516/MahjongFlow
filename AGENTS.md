# MahjongFlow 项目文档规则

## 周计划与天计划

未来添加或修改周计划和天计划时，必须参考以下模板：

- 周计划模板：`docs/templates/WEEK_IMPLEMENTATION_PLAN_TEMPLATE.md`
- 天计划模板：`docs/templates/DAY_IMPLEMENTATION_PLAN_TEMPLATE.md`

执行要求：

1. 周计划统一按 5 个工作日编排。
2. 每个工作日必须建立一份独立的天计划。
3. 周计划存放在 `docs/plans/week-N/WEEK_N_IMPLEMENTATION_PLAN.md`。
4. 天计划存放在同一周目录中，命名为 `DAY_N_{TOPIC}.md`。
5. 周计划必须链接对应的 5 份天计划，天计划也必须链接所属周计划。
6. 必须替换模板中的全部占位内容，不得保留 `{占位内容}`。
7. 每份计划必须包含明确的目标、开始条件、执行步骤、交付物、验收标准和未完成项处理方式。
8. 执行步骤必须按顺序编写，并说明每一步的具体操作、产出和检查方法。
9. 计划内容必须遵循 `docs/project/MVP_PROJECT_PROPOSAL.md` 的范围、排期、权限和验收基线，不得自行扩大 MVP 范围。
10. 新增需求默认进入 Post-MVP Backlog，除非已经正式批准替换现有范围。
11. 创建或移动计划文件后，必须检查所有 Markdown 相对链接是否有效。
12. 新计划应保持与现有 `docs/plans/week-1/` 文档一致的语言、结构和详细程度。

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

1. `main` 是可部署基线，日常功能和修复不得直接在 `main` 上提交。
2. Codex 创建的分支统一使用：

   ```text
   codex/<issue-number>-<short-kebab-description>
   ```

3. 分支名必须包含真实 Issue 编号；描述使用小写英文与连字符。
4. 一个分支只解决一个主要 Issue，目标生命周期不超过两个工作日。
5. 创建分支前确认基于预期的最新 `main`；如果更新 `main` 需要拉取远程内容，应先确认不会破坏当前工作树。
6. 打开 PR 前再次同步 `main` 并处理冲突，不得通过删除他人改动来消除冲突。
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
3. PR 必须关联 GitHub Issue，并列出对应 P0/P1/Post-MVP ID。
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
6. 创建 PR 后必须报告 URL、目标分支、是否 Draft、已运行检查和待审查事项。

### 6. 审查、测试与合并

1. PR 作者必须先完成自查和相关测试。
2. 至少一名非作者成员批准后才能进入 `Testing`；Codex 不得把自己的检查视为团队批准。
3. 阻塞性审查意见必须解决；修复后重新运行受影响检查并请求复审。
4. 所有必需检查、验收场景和文档更新通过后才可合并到 `main`。
5. 涉及权限、敏感数据、数据库约束或核心回归测试的检查不得因排期跳过。
6. 合并属于独立的外部状态变更，必须有用户明确授权；创建 PR 的授权不自动包含合并授权。
7. 合并后检查 Issue、项目板、文档、部署和分支状态，再判断任务是否满足 Definition of Done。

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
检查 status、branch、remote 和 Issue
→ 确认范围、验收条件及工作树归属
→ 从 main 创建 codex/<issue>-<description>
→ 实现并执行必要验证
→ 检查 diff 并显式暂存范围内文件
→ 复核 staged diff
→ 创建单一目的 commit
→ 再次检查工作树
→ 经明确授权 push
→ 经明确授权创建关联 Issue 的 PR
→ 等待非作者审查和 Testing
→ 经明确授权合并
→ 更新 Issue、项目板、文档和部署状态
```

任一步骤缺少授权、Issue、验收条件、必要验证或安全前提时，Codex 应停在该步骤，说明缺失内容，不得跳过流程。
