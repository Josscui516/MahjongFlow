# 通用晚餐资格名册与活动发放记录

## 当前需求与交付

2026-10-18 用户明确纠正：有晚餐资格的人员进入独立的通用名册，资格持续有效，各活动共用；活动的晚餐页面列出本场可领取人员，并支持勾选已发放。此前按活动预录名册的解释已被本决定替代。扫码报名仍只报名，工作人员仍通过 Attendance 确认本场签到。

继续在用户已授权的 [Issue #102](https://github.com/Josscui516/MahjongFlow/issues/102)、分支 `codex/102-match-dinner-check-ins` 和 [PR #103](https://github.com/Josscui516/MahjongFlow/pull/103) 内修正。补丁仍直接指向 main，不包含二维码权限 PR #101，不依赖其迁移。没有合并、Project 修改、关闭 Issue 或远程数据库操作授权。

## 用户入口与规则

- 管理员从侧栏 **Dinner eligibility roster** 或活动晚餐页的 **Manage shared dinner eligibility roster** 进入 `/dinner-roster`。名册录入不需要选择活动；按标准化邮箱唯一，添加一次即可持续用于所有活动。
- 名册资格不因报名、签到、活动结束或领取晚餐而失效。管理员显式移除会停用通用资格，再次录入同邮箱可恢复；这用于更正或撤销资格，不是每场重录。
- 活动详情 → **Verify dinner eligibility**，进入 `/dinner-verification/[eventId]`。本场有效报名、已确认签到且邮箱匹配活跃通用名册的人员显示为 **Ready to collect**。
- 工作人员实际发放后勾选 **Issued**；服务器保存活动、参与者、发放时间和真实操作者。刷新后保留，其他工作人员看到同一状态。另一场活动独立从未发放开始，通用资格不被消耗。
- 同场同人只有一个当前发放状态。重复发放请求幂等，不能重复生成发放记录。取消勾选需要确认，仅用于纠正录错。
- 如果实际已经发放，之后撤销签到、取消报名或停用资格，该发放记录仍显示为已发放并提示资格已变化；不会隐藏已发饭的事实。显式清除误勾后，若当前不符合领取条件，则不再显示在本场待领取列表。

通用名册管理继续要求活跃 authorised 且具备账号管理能力；授权工作人员可以核验和记录活动发放。普通委员、停用用户和匿名不能访问敏感名单或写发放状态。邮箱标准化为去首尾空格并转小写；姓名不作为匹配键。

## 数据与迁移

在原匹配迁移 `20261016001507_match_dinner_roster_with_confirmed_attendance.sql` 之后应用 `20261018001952_global_dinner_roster_and_event_issuance.sql`，再发布前端。已有库不能 reset；拉代码、重启 Docker 或重建镜像均不会自动执行迁移。

新增 `dinner_eligibility_roster`：无 event_id，email 唯一，身份字段与原名册同样有长度／格式约束，记录录入者和时间，默认拒绝 RLS，仅授权人员可读，管理员可维护受限列。迁移将旧活动名册中仍活跃的邮箱去重转入通用名册；同邮箱选择最新活跃条目的姓名和录入审计值；全部失活的邮箱不恢复。原 `dinner_roster` 和原数据保留，撤销应用会话的列写权限，不再作为资格来源。

新增 `event_dinner_issuance`：活动与参与者联合主键，外键 restrict，发放时间／操作者必须同时为空或同时存在，另存最后修改者和时间。仅 authorised 可读，authenticated 无直接写权限，必须调用 `set_event_dinner_issued`。新 RPC 以真实 auth.uid 为操作者，拒绝传入伪造操作者，显式检查活跃 authorised 权限，锁定活动以序列化并发操作，首次发放还锁定并核对通用资格、报名和签到事实。取消勾选保留该行及最后修改审计，不是删除身份或报名数据。

读函数保持 SECURITY INVOKER 与原表 RLS，活动列表同时保留当前合格人员与已发放历史。旧匹配函数签名保留，来源改为通用名册；新 `list_event_dinner_service` 提供当前资格和发放状态。新写函数为固定 search_path 的 SECURITY DEFINER，仅 authenticated 可执行，内部权限和资格检查完整，匿名 execute 撤销。生成类型由 CLI 更新。

不新增猜测的发放历史：迁移后全部活动初始未发放，只有工作人员勾选才写记录。已有报名、签到、QR token 不变。

## 回退

先撤下新前端和发放入口，再决定数据库回退。可保留新表／记录而回退应用；这会恢复旧的按活动名册解释，不能视为符合当前需求。必须保留通用资格和发放记录，不能 reset、删除记录或把已发放记录当作未领取。

需要停用新结构时，通过前向 migration 撤销新 RPC 的 execute，恢复旧读取函数／旧名册列权限；先导出受保护的数据备份并经业务负责人决定如何保留已发放事实。不能只用 Git revert 或 drop table 代替数据恢复。

## 验证

- 全量应用：928 passed、3 skipped（含真实本地报名／签到／晚餐和 Task–Meeting 用例）；新增服务端权限／错误映射、独立页面、导航及发放状态显示测试。
- 真实本地 API 并发提交同一发放请求，返回同一发放时间且只有一行；恢复未发放后仍可按当前资格重新核验。
- 干净隔离库重放本分支全部迁移、虚构 seed 与 18 个 SQL 文件，477 项断言通过，其中晚餐匹配／通用资格／发放回归 30 项。不依赖二维码权限补丁。
- 独立迁移验证：旧活动名册相同邮箱去重、保留最新活跃姓名、纯失活人员不恢复、旧记录保留、迁移不虚构发放记录。
- ESLint、TypeScript、数据库 schema lint、Docker 生产构建通过。
- Chrome／Playwright：独立通用名册录入 → 扫码报名 → 工作人员签到 → 勾选发放 → 刷新保留 → 同人在第二活动无需重复录入资格且发放状态独立 → 撤销签到仍显示已发放 → 确认清除误勾 → 非管理员可以发放但不能维护资格。390px 手机无横向溢出，未发现运行时错误，测试资料均为虚构并已清理。
- 本会话未提供 Browser 插件及其 browser skill，按 frontend-testing-debugging 指引使用 Playwright／Chrome。旧按活动名册截图与原日期测试数字不代表当前规则。

截图：[独立名册](../../src/features/dinner-verification/evidence/dinner-global-roster-desktop.png)、[活动已发放](../../src/features/dinner-verification/evidence/dinner-global-event-desktop.png)、[手机名册](../../src/features/dinner-verification/evidence/dinner-global-roster-mobile.png)。
