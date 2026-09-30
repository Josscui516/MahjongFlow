# 虚构活动数据清理与保留政策

关联：Issue #29、PRIV-04、R-07。维护者：Joshua。核验日期：2026-09-30。

## 1. 范围与权限

本流程只删除一个虚构活动的 `registrations` 和 `attendance_records`。保留活动、token 历史、共享参与者身份、其他活动、会议及任务。晚餐资格继续由有效签到推导，清理后不得仍显示原资格。

入口为 [本地维护脚本](../../supabase/maintenance/fictional-activity-cleanup.mjs)，没有网页、Server Action、公开 RPC 或应用角色授权。脚本固定连接 `supabase_db_mahjongflow-issue33-sprint7`；需要维护者的本机 Docker／postgres 权限，普通 `anon`／`authenticated` 不能直接 DELETE。不以 `authorised` 业务角色代替运维授权。

该命名栈由 `tmp/sprint7-db` 管理，API 46321、DB 46322，与原 `MahjongFlow` 本地数据卷及生产隔离。未启动时脚本失败；不得改容器常量指向默认栈或生产。名字和 `@example.test` 是额外防误操作条件，不能单独证明任何环境里的数据都虚构。

## 2. 开始条件与预览

先核对隔离栈容器、活动 UUID、完整活动名、虚构 fixture 来源和受影响范围；暂停本地验收写操作。不要对共享或生产环境运行本脚本。

```powershell
node supabase/maintenance/fictional-activity-cleanup.mjs <活动UUID> "Fictional 完整活动名"
```

默认 dry-run，仅打印报名／签到数量，不写数据、打印身份或 token。无效 UUID、找不到活动、名字不匹配、非虚构身份均拒绝。空活动返回零数量，不扩大清理范围。

## 3. 备份与执行

```powershell
node supabase/maintenance/fictional-activity-cleanup.mjs <活动UUID> "Fictional 完整活动名" --apply tmp/fictional-cleanup-backups/unused-backup.json
```

备份必须位于 Git 忽略的 `tmp/fictional-cleanup-backups/`，使用未占用文件名。备份只含已检查的虚构活动、身份及完整关系行，仍不得上传或提交。文件写入失败或已有同名文件时不删除。

脚本先持久化完整快照，再在事务中锁定目标活动和关系／身份表，比较完整快照摘要。预览后数据改变、锁超时或 SQL 出错均回滚；快照比较用途不是密码安全。表锁在短事务内也会短暂阻止其他活动写入，因此只适用于专用本地维护窗口。成功仅输出删除数量。

执行后复核目标报名／签到为零，活动 B 的整行与原快照一致，共享参与者仍存在。旧页面须重新读取，不能拿浏览器缓存的资格作为数据库结果。

## 4. 恢复与不可逆影响

清理不是可从产品界面撤销的操作；没有备份时不能靠回滚 schema 恢复。若命令失败，先检查原记录是否保留及备份文件是否存在，不要直接重复删除。

恢复只由维护者在同一隔离库进行：核对 JSON 中的容器、活动 UUID、参与者及操作者外键；确认目标关系仍为空，并暂停写入。在事务内锁定活动、报名和签到表，将备份的 `data.registrations`／`data.attendance` 经 `jsonb_populate_recordset` 转为对应表行，先插入报名、再插入签到。冲突时回滚，禁止覆盖现有更正。恢复后逐行比较 UUID、时间及审计字段，再确认活动 B 和共享身份不变。不要恢复 token 明文或伪造签到操作人。

可执行恢复示例及真实比对见 [清理回归](../../tests/integration/registrations/fictional-cleanup.mjs)。该回归同时证明旧快照失败不会部分删除、备份不会被覆盖及原始审计时间可恢复。

## 5. 验证与数据库影响

```powershell
node tests/integration/registrations/fictional-cleanup.mjs
```

在上述专用栈创建两个虚构活动和一个共享参与者，测试失败路径、权限拒绝、活动隔离及完整恢复；最后只清除此回归自己的 fixture。现有 SQL 角色矩阵另覆盖 committee、authorised 和匿名。脚本不引入 schema、函数、索引、RLS 或生成类型变更，因此不需要新 migration 或手工修改数据库类型。

## 6. 保留期限与正式使用门槛

真实参与者数据保留期限仍待 Stakeholder 确认，不承诺永久保存或自行设定天数。Joshua 在最终评审提出：保留目的、期限、负责人、授权删除、备份保留及跨活动身份处理；经确认后写入权威隐私说明并另行实现生产流程。

待确认政策不阻止虚构数据开发／内部验收，但阻止宣称真实使用的最终保留政策已经完成。本脚本不用于生产，也不代表全部个人数据删除：共享身份和审计／token 历史明确保留。
