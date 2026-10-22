# 2026-10-22 本地快照生产发布

Joshua 明确授权将整个本地项目和数据库发布到现有 Vercel／Supabase，替换原云端业务数据；核对发现本地共有 7 个账号后，明确确认全部保留。本次按用户要求作为直接发布 main 的流程例外，不创建 PR、不进行团队 review、不等待 CI，并跳过后续测试。原因是用户要求直接发布当前本地完整快照；不修改长期 Sprint 协作规则，不创建虚构 Issue。

发布前 lint、typecheck、production build、1101 项应用测试和 5 项脚本测试已通过。数据库回归存在账号管理、QR 权限及 fixture 外键失败；用户随后明确要求跳过一切测试。本次不将这些失败描述为通过，仍需后续独立排查。

本地与原云端均已生成用户私有目录下的加密备份，不提交备份、账号、密码哈希或密钥。云端原始备份包含 public、private、auth 和 migration history，共 45 张表；本地备份包含应用、认证及 migration schema。备份以 Windows 当前用户 DPAPI 保护，恢复须使用原 Windows 用户。远程备份密文与 DPAPI 保护的一次性随机 pad 必须配套保留。

云端先应用仓库中 20261021 的 9 个 migration，再在单个事务中清空原有应用数据、账号及旧会话，导入本地 public／private 数据、auth.users 和 auth.identities，并对齐本地 migration history。保留 7 个账号的 ID、密码哈希和角色；会话不迁移，所有用户重新登录。Supabase 托管服务的系统 schema／版本记录保持其平台版本，不以本地服务版本覆盖。

导入后执行操作结果读回：云端 users／profiles 均为 7；17 张应用表的行数和全行摘要与本地一致。这是迁移完成核对，不代表此前失败的数据库回归已修复。Storage 无对象，无对象文件需要复制。

发布目标为现有 mahjong-flow Vercel 项目的 Production，数据库为现有 MahjongFlow Supabase 项目。保持原云端连接及服务端 Secret，避免把本地凭据用于生产。只发布应用、配置、文档和 migration；本地审计截图留在工作区。

回退需要同时处理代码与数据：代码可回到发布前 e0ac9ea；数据库恢复须先恢复对应旧 schema，再用加密云端备份恢复数据和原 migration history。仅回退代码无法撤销数据替换，也无法自动恢复已撤销的登录会话。不可在未备份发布后新数据时再次清空数据库。
