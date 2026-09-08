# #22 站内到期风险提醒

公共入口：`@/features/tasks/reminders`。本组件是纯展示组件，可用于 Server Component 或客户端宿主；不访问数据库、认证、时钟或通知 API，不计算日期，不引入客户端状态。

## 输入和输出

`risk` 直接接受 #16 的 `DueRiskResult`；`taskTitle` 是宿主已经获准展示的任务标题；可选 `taskHref` 是宿主现有受保护任务详情路径。无可访问链接时省略该属性，组件展示文本，不提供假链接。不得将组件本身当作权限检查。

| 分类 | 展示 |
|---|---|
| overdue | 三角警示图标、Overdue、Sydney 日期语义及任务上下文 |
| dueSoon | 时钟图标、Due soon、今天至第 7 日的说明及任务上下文 |
| normal / completed | 不渲染提醒，无隐藏焦点或遗留告警 |
| invalid | 中性信息图标、Due status unavailable；不暴露内部错误 reason |

可见链接文本同时提供屏幕阅读器名称；图标为装饰且不进入焦点顺序。文字可换行，不以颜色独立传递状态。不使用列表级重复 alert。链接关闭预取，但仍采用 Next Link 导航。

## 任务列表宿主示例（Li / #20）

以下是挂载示例，不是新增页面或已完成集成的证据。`now` 必须由宿主提供统一快照，`task` 来自已授权查询；不要在组件内部或每一行重新读取时钟。

```tsx
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { DueRiskReminder } from "@/features/tasks/reminders";

<li>
  {/* 原有任务内容和操作由列表宿主维护 */}
  <DueRiskReminder
    risk={classifyTaskDueRisk({ dueDate: task.dueDate, status: task.status, now })}
    taskTitle={task.title}
    taskHref={`/tasks/${task.id}`}
  />
</li>
```

## Dashboard 宿主示例（Xuanwei / #21）

```tsx
import { DueRiskReminder } from "@/features/tasks/reminders";

<section aria-label="Overdue tasks">
  {items.map(({ task, risk }) => (
    <DueRiskReminder
      key={task.id}
      risk={risk}
      taskTitle={task.title}
      taskHref={`/tasks/${task.id}`}
    />
  ))}
</section>
```

此处 `items` 是示例的局部映射，不是对 #21 查询 DTO 的新增合同。宿主使用与其统计相同的分类快照，提供 `task` 和原始 `risk`。如现有整行已是链接，将提醒放在该链接外，或省略 `taskHref`，避免嵌套链接。

## 状态和责任

loading、empty、权限拒绝、查询失败和任务写入状态由两位宿主所有者处理；加载或拒绝时不要传虚构任务渲染。无效分类必须显示反馈，不能视为 normal 或用于伪造零计数。完成任务后宿主刷新原数据和分类，本组件据新 completed 输入消失。

本 Issue 不改变 schema、RLS、migration、生成类型、认证或共享配置。上线前仍需两处真实宿主挂载、受保护页面验证、实际页面窄屏/键盘/网络检查以及 Joshua 的非作者审查。仅通过 fixture 或候选 #16 的组件测试不能合并 #22 或标记 Done。

## 本次个人交付记录（2026-09-08，Australia/Sydney）

- Issue：#22，Sprint 5，负责人 Yubo Cai（Caiqwe123）；Project 读取时为 Backlog / Incomplete，无其他主要 Issue 处于 In Progress。
- Sprint 源码快照：`251d15054ff02cd461c85c9687cd4086de6e25ce`；成员分支为 `codex/22-due-risk-reminders`，Draft PR 指向 `sprint/5-dashboard-follow-up`。创建 Draft 不代表通过验收，Project 仍由 Joshua 维护。
- 候选组合验证：在独立源码副本中另加入 #16 / PR #71 的原样提供者代码与测试（`9ea6fd822079b39d7ed85b3e77e9f3048d256484`）；这些不是 #22 的改动，不能重复提交。
- 本 Issue 交付仅为 `src/features/tasks/reminders/` 中的组件、测试、使用说明和虚构截图，以及 `tests/integration/task-follow-up/reminders/reminders.test.tsx`。
- 执行运行时 Node.js 24.19.0；使用现有依赖，无新增包、lockfile 或配置改动。

以下结果针对 Sprint 基线与 PR #71 提供者的本地候选组合，不是当前 Draft head 的全绿证明。Draft 分支不复制 Shiying 的代码；上游尚未合入 base 时，缺少 `due-risk` 导入会阻断类型检查和分类器集成测试。

| 验证 | 候选组合的实际结果 |
|---|---|
| `npm run lint` | 通过 |
| `npm test` | 65 文件、388 项测试通过；数据库测试运行器的 5 项脚本测试通过；其中 #22 新增 23 项 |
| `npm run typecheck`（生产构建前） | 通过 |
| `npm run typecheck`（构建生成路由类型后复查） | 同一既有会议历史页 PageProps 错误阻断；不能声明最终全量类型检查通过 |
| `npm run test:acceptance` | 21 文件、148 项既有验收回归测试通过；不替代 #22 的真实宿主集成验收 |
| `npm run build` | 环境阻断：源码副本的 node_modules junction 超出 Turbopack root |
| `node node_modules/next/dist/bin/next build --webpack` | 编译成功，随后既有会议历史页 PageProps 类型检查失败；干净 Sprint 基线同样复现 |
| Chrome / Playwright 组件夹具 | 1280×900、320×900；非空、无 overlay、无控制台警告/错误；Tab 焦点、Enter 导航、长标题换行通过 |
| 大字及非颜色提示 | 320px、200% 文字缩放无横向溢出；强制颜色模式仍有可见风险文字 |
| 配置与网络 | #22 不引入外部 SDK、网络或通知调用；夹具仅请求本地页面与虚构任务目标 |
| 数据库/RLS | 未运行数据库验证：本组件无持久化、查询、认证或 RLS 变更；脚本单元测试不等同于数据库验证 |

浏览器工具路径：会话无 Browser skill，使用现有 Playwright 与已安装 Chrome；没有安装依赖。验证地址为 `http://127.0.0.1:4322`，检查结束后已停止。它是通过真实组件 SSR 和 Tailwind CSS 生成的虚构夹具；导航目标也是测试页面，不代表真实受保护任务页。虚构组件截图见 [桌面](evidence/desktop.png)和[窄屏](evidence/mobile.png)。截图仅证明组件展示，不是两处真实宿主完成的证据。

### 尚未完成与交接

1. Shiying / #16：PR #71 尚未合并，需重新核对最终公共合同。当前验证使用候选提供者，不代表上游验收已完成。
2. Li / #20、Xuanwei / #21：分别在真实任务列表和 Dashboard 挂载提醒，并在任务完成后刷新同一分类快照。Yubo 复验两处真实页面、角色/导航、窄屏和网络，再交 Joshua 审查；这些 T-07 集成项目仍未通过。
3. Joshua：协调既有 `src/app/(dashboard)/meetings/(history)/page.tsx:19` 默认参数导致的构建类型错误（参数类型包含 undefined，不满足生成的 PageProps）；干净基线可复现。此处未越界修改会议页面。
4. 以上阻断首次记录于 2026-09-08 22:03 Australia/Sydney；Yubo 负责在 2026-09-09 22:03 前复查依赖与构建修复。超过一个工作日由 Joshua 升级；本次没有发送消息或设置自动提醒。
5. 最终候选集成、质量 checks、Joshua 非作者审查与成员/Sprint 合并尚未完成；不能将 #22 标为 Done。Sprint 6 #27 → #28 本次没有开始。

回退：回退本 Issue 提交及由宿主所有者后续加入的调用；不需要数据恢复或 migration 回滚。PR #71 合入后同步 Sprint 分支，重新执行 head 检查；保留 Draft 直到真实宿主接入、验收与构建阻断解除。
