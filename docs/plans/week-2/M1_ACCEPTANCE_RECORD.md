# M1 验收记录

> 主要 Issue：#41
>
> Sprint：Sprint 2
>
> 当前结论：未完成；真实工作包尚未全部进入 Sprint 集成分支。

## 1. 验收矩阵

| 场景 | 固定预期 | 当前证据 | 结论 |
|---|---|---|---|
| X-01 | 有效后台用户可以登录、刷新会话并安全登出 | 等待 #9 集成 adapter | 阻塞 |
| X-02 | 错误凭据不创建会话且不泄露账号是否存在 | 等待 #9 集成 adapter | 阻塞 |
| X-03 | 匿名页面和服务端请求不返回后台数据 | 等待 #9 集成 adapter | 阻塞 |
| X-04 | 两种后台角色可协调，敏感访问仅限 authorised | 等待 #10 集成 adapter | 阻塞 |
| X-05 | committee 无法绕过服务端或数据库权限 | 等待 #10 集成 adapter | 阻塞 |
| X-06 | 匿名 token 操作仅暴露最小且不可枚举的合同 | 等待 #10 集成 adapter | 阻塞 |
| X-07 | 反馈状态可区分、可访问并会终止 | 等待 #11 集成 adapter 与浏览器证据 | 阻塞 |

本表不得在缺少 adapter、独立审查或真实检查结果时标记为通过。自动化入口为
`npm run test:acceptance`；缺少 adapter 时必须返回明确的阻塞结果，不得使用默认成功值。

## 2. 统一质量入口

| 类别 | 命令 |
|---|---|
| Lint | `npm run lint` |
| TypeScript | `npm run typecheck` |
| 应用与验收测试 | `npm test`、`npm run test:acceptance` |
| 数据库重放与测试 | `npm run db:reset:no-seed`、`npm run db:reset`、`npm run db:test` |
| 数据库 lint／漂移 | `npm run db:lint`、`npm run db:diff` |
| 生产构建 | `npm run build` |

完整集成验收还必须运行 #39 与 #40 提供的真实双连接并发入口，并记录精确断言数。
`Quality` 工作流中的独立 `Database` 检查会依次执行无 seed／有 seed migration 重放、
数据库测试、数据库 lint 和空漂移验证；`Build` 只有在应用测试与数据库检查均成功后才运行。
双连接脚本在对应工作包进入 Sprint 后接入该检查，缺少集成时不得把普通数据库检查解释为
X-01 至 X-07 已通过。数据库测试入口会把 `Files=0`、`Tests=0` 或 `NOTESTS` 视为失败，
避免 Supabase CLI 的零测试成功退出码造成假绿色门禁。

## 3. 脱敏证据格式

证据只记录命令、Git commit、通过／失败状态、断言数量、脱敏摘要和阻塞负责人。
不得保存或粘贴以下内容：

- 密码、cookie、session、JWT、check-in token 或授权 header；
- Supabase secret／service-role key、数据库密码或 Vercel token；
- 真实参与者姓名、邮箱、学号、报名、签到或晚餐资格；
- 未脱敏的 provider 错误、数据库 dump、日志或截图。

测试 fixture 统一使用 `.example.test` 地址和固定虚构 UUID。发现敏感证据时立即停止传播，
撤回相关输出并执行凭据轮换与暴露范围评估。

## 4. 当前阻塞与责任

| 阻塞 | 影响 | 负责人／所需动作 | 下次检查 |
|---|---|---|---|
| #39、#40 等待新的非作者 review | 无法按顺序进入 Sprint | `Scarletthekiller` 完成最新 head 审阅 | review 到达后立即 |
| 非项目成员的 Vercel Preview 被阻止 | 远程 Preview 门禁不完整 | Vercel 项目所有者检查 Git／成员访问策略并安全重跑 | 工作包合并前 |
| #9、#10、#11 尚未完成集成 | X-01–X-07 真实 adapter 不可全部接入 | 各工作包按既定顺序进入 Sprint | 每个上游合并后 |
| #41 尚无集中非作者审批 | M1 不得标记通过 | Shiying 在最终集成后集中审查 | PR Ready 后 |

## 5. 最终结论规则

只有 X-01 至 X-07 全部通过、完整质量命令成功、数据库 migration/RLS/并发检查成功、
浏览器桌面／窄屏／键盘／可访问性回归通过、所有纳入 Issue 均为 `Testing` 且
Acceptance Gate 为 `Passed`、所有阻塞 review thread 已解决并取得非作者审批时，M1 才能
从“未完成”改为“通过”。任何一项缺失时结论保持阻塞，并记录负责人和下一次检查时间。
