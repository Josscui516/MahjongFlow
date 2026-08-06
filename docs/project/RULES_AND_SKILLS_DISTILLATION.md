# Rules 与 Skills 蒸馏记录

## 1. 目的

本文记录从 `E:\lessons\zero_day_fraud\zero_day_fraud` 提炼并适配到 MahjongFlow 的协作和工程规则。来源项目只作为设计输入，不是 MahjongFlow 的权威文档；最终生效内容以本仓库的 `AGENTS.md` 和 `.agents/skills/` 为准。

## 2. 来源分类

| 来源内容 | 分类 | MahjongFlow 处理 |
|---|---|---|
| 函数式核心、命令式边界 | 通用工程规则 | 保留，适配到日期、状态、资格、验证和数据转换 |
| SOLID、组合优先、窄接口、显式依赖注入 | 通用工程规则 | 保留，明确其为设计与审查准则，不强制类或继承 |
| 确定性、契约测试、增量与完整计算等价 | 通用工程规则 | 保留，在存在相应实现时应用 |
| 权威文档分层、范围冲突不静默处理 | 通用协作规则 | 保留，改用 MahjongFlow 的 proposal、架构、安全和运维文档 |
| 分支、验证、PR、Review、交接与上下文恢复 | 通用交付流程 | 保留，但服从 MahjongFlow 更严格的逐项 Git 授权规则 |
| Linear Issue、状态、阻塞和交接 | 工具相关流程 | 改写为 GitHub Issues 与 GitHub Project |
| 保险业务、欺诈角色、Oracle、零日泄漏和实验冻结 | 来源项目专属 | 排除，不进入 MahjongFlow 规则或 skill |
| 车险初版与医疗延期 | 来源项目专属 | 排除 |
| 中英双语文档与 CHANGELOG 强制要求 | 来源项目专属 | 排除；MahjongFlow 保持现有文档语言约定 |
| Python、CLI、模型、OCR、embedding、Redis/RQ 约束 | 来源技术栈专属 | 排除 |

## 3. Linear 到 GitHub 的映射

| 原 Linear 概念 | MahjongFlow 对应方式 |
|---|---|
| Issue | GitHub Issue |
| Project / milestone 上下文 | GitHub Project、Epic Issue、标签和目标开发周 |
| Sub-issue / related issue | GitHub sub-issue、父 Epic、依赖链接或关联 Issue |
| 状态 | `Backlog → Ready → In Progress → Review → Testing → Done` |
| 阻塞状态 | `blocked` 标签或 Project 中实际存在的等效字段 |
| 负责人 | GitHub assignee |
| 验收条件 | Issue body 中带场景 ID 的 checklist |
| 交付链接 | Issue 中关联 branch、commit 和 Pull Request |
| 长期架构决策 | 仍回写 `README.md` 或 `docs/`，不只保留在 Issue 评论 |

GitHub 写操作不继承来源项目的长期自动授权。读取和分析可用于恢复上下文；创建、编辑、评论、关闭 Issue，修改 Project，以及 branch、commit、push、PR、merge 等操作，均遵守根 `AGENTS.md` 的明确授权边界。

## 4. MahjongFlow 专属适配

通用规则在本项目中落到以下边界：

- MVP 范围、角色和验收以 `MVP_PROJECT_PROPOSAL.md` 为基线；
- 模块结构遵循 feature、共享 UI、server-only Supabase 和明确公共入口的分层；
- 普通委员会、`authorised` 和匿名参与者采用最小权限与默认拒绝；
- schema 与 RLS 只通过 timestamped migration 修改，并包含回滚、权限测试和生成类型；
- 日期计算使用 `Australia/Sydney`；
- Next.js 实现以当前安装版本的本地文档为准；
- 所有测试、截图、seed 和演示只使用虚构或匿名化数据。

## 5. 最终产物

| 文件 | 职责 |
|---|---|
| `AGENTS.md` | 强制规则、权限边界和规则优先级 |
| `.agents/skills/mahjongflow-development/SKILL.md` | 实现、审查、数据和验证的任务流程 |
| `.agents/skills/project-delivery-workflow/SKILL.md` | GitHub Issue、Git、PR、Review、Testing 和交接流程 |
| 本文件 | 来源、取舍和 Linear→GitHub 迁移依据 |

skills 负责按需提供过程细节，不复制全部项目文档，也不扩大 `AGENTS.md` 授予的权限。
