# Sprint 结束后的网站补丁交付

> 2026-10-16 后续补丁：[管理员二维码权限与错误提示修复](ADMIN_QR_MANAGEMENT_FIX.md)，继续关联 #99；独立管理员能力纳入 QR 管理，同时保留参与者数据角色边界。原记录中的测试数字仅代表其原日期版本。

日期：2026-10-15，Australia/Sydney。对应 [Issue #99](https://github.com/Josscui516/MahjongFlow/issues/99)。

## 路由授权与范围

用户明确要求将当前已完成网站上传 Git，并将 Sprint 结束后的补丁用单个 PR 直接提交到 `main`。这次例外仅替代两层 Sprint PR 路由；不代表授权合并、关闭 Issue、变更 Project、放宽分支保护或重置生产数据库。用户随后明确授权创建补丁 Issue。历史 Sprint 8 的 #94／#29 保留原关闭状态，不作为这次新增需求已经验收的证明。

分支为 `codex/99-post-sprint-website-patch`，起点为远程 `main` 的 `fa1bfd9`。本次没有分配新 Sprint；实现与交付由 Joshua 收尾，审查人仍由团队指定。PR 类型为 Sprint 后补丁，主要 Issue 为 #99，base 为 `main`。

## 当前候选版本

1. QR 为首次参与者提供活动报名，报名、实际签到、晚餐资格分离。管理员预录独立晚餐名册，授权工作人员核验；参见[报名与晚餐决定](REGISTRATION_AND_DINNER_CORRECTION.md)。
2. 开发环境动态选择本机局域网地址；本地 Docker 从启动脚本获得宿主机地址并使用同源 API 代理，正式部署使用可信 HTTPS origin。
3. 新增前端 standalone 镜像、Compose 配置和 Windows 启动脚本，连接现有本地 Supabase 网络并保留数据库卷。
4. 后台首页统一为 `/dashboard`，旧 `/backoffice` 跳转；任务摘要、近期活动和快捷入口集中展示。
5. Task 与 Meeting 支持多对多关联，任务创建／编辑可多选会议；事务保存、双向导航和原始来源保护见[关联决定](TASK_MEETING_ASSOCIATIONS.md)。

## 验证记录

- Lint、TypeScript 检查及 Docker 内的生产构建通过。
- 包含 `ISSUE35_LIVE_DATABASE=1` 与 `TASK_MEETINGS_LIVE_DATABASE=1` 的应用测试：909 passed，3 skipped。跳过的既有用例不作为已执行证明。
- 在隔离数据库复制基础 Supabase schema，清空该隔离库的应用 schema，逐一重放全部 migration、记录版本并加载虚构 seed；17 个 SQL 文件／447 项断言通过。最后删除隔离库，工作数据库未 reset。
- 本地数据库 schema lint 无错误。公开报名和名册的真实 Auth／RLS 测试，以及关联保存与并发测试均执行。
- Chrome 桌面 1440px、手机 390px 验证任务关联的创建、增减、双向展示、决策转换及完成状态同步；另验证匿名重定向，无相关控制台／运行时错误。
- Dashboard 的桌面与手机登录、旧入口跳转、快捷操作和品牌返回通过；Docker 的 localhost 与 LAN 登录／会话保持通过。报名、重复提交、后台列表、独立名册维护与非管理员拒绝通过。
- 窄屏和桌面截图、临时脚本保留在本地运行目录，不将无关演示资料或运行文件加入提交。浏览器验证不替代独立代码审查。

## 发布顺序、回退与边界

先部署 `20261004061203_separate_public_registration_and_dinner_roster.sql` 与 `20261015022518_add_task_meeting_links.sql`，再发布前端；生成类型随本次代码提交。PR 合并后可能触发现有 Supabase／Vercel 发布流程，应按两份需求决定核对兼容性。

新增晚餐名册初始为空，必须由管理员录入，不会从历史签到导入资格。公开报名的操作者为空，不能为了旧 NOT NULL 约束编造后台操作者。Task 原始来源会回填关联，其他历史资料保留。数据库回退及信息保留限制遵循上述决定文件；恢复旧前端不能视为撤销业务规则变更。

环境文件、运行凭据、真实参与者数据、临时截图和既有演讲资料不进入提交。PR 检查、非作者审查及合并结果应以 GitHub 实际记录为准，本记录不预先宣称通过或已上线。
