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
