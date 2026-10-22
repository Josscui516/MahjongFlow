# Dashboard 本地展示数据

仅用于现有本地 Docker 数据库 `supabase_db_MahjongFlow`。使用虚构任务和场地，不创建账号、参与者、报名或签到，不修改 Schema、RLS 或已有记录。所有标题以 `[Demo]` 开头，描述带有批次标记 `Dashboard demo batch 2026-10-21:`。

## 写入

在仓库根目录运行：

```powershell
Get-Content -Raw supabase/fixtures/dashboard-demo.sql | docker exec -i supabase_db_MahjongFlow psql -X -U postgres -d postgres -v ON_ERROR_STOP=1
```

脚本要求已有唯一的活跃 `General` 测试账号，以及一个活跃 authorised 测试账号。固定 UUID 与 `ON CONFLICT DO NOTHING` 保证重复执行不重复插入、不覆盖修改。日期按首次写入时的 Sydney 当日计算；重复执行不会刷新已有日期。不要通过 reset 或整库 seed 刷新这批数据。

## 场景与预期

2026-10-21 写入并验证：

| 场景 | 预期 |
|---|---|
| 本人未完成 | General 负责的 10 项 |
| 逾期 | 全委员会 5 项，红色统计及逾期提醒 |
| 七天内到期 | 7 项，包含今天及第 7 天，排除第 8 天 |
| 全部未完成 | 17 项，包含其他负责人和未关联活动的独立任务 |
| 已完成 | 3 项，覆盖过去／今天／未来截止日期，均不计入未完成统计 |
| 状态 | `not_started`、`in_progress`、`completed` |
| 列表长度 | 四个任务分组均超过 3 项，可测试展开／收起 |
| 长文本 | 长任务标题、长活动标题及场地名称 |
| 近期活动 | 6 项，按开始时间排序，包括周例会和锦标赛 |
| 排除活动 | 过去的 scheduled、未来的 cancelled、未来的 completed 各 1 项 |
| 导航 | 任务详情、活动详情、统计卡页内定位、查看全部及创建入口 |

分组相互重叠，不能相加作为总数。日期推进后逾期／临期／近期活动数量会变化。空状态已被有数据状态替代；加载、系统错误和权限拒绝不能通过正常业务记录同时展示，仍使用现有测试覆盖。

## 清理

用户需要移除这批数据时，再运行以下命令；本次准备数据不会执行清理：

```powershell
Get-Content -Raw supabase/fixtures/dashboard-demo-cleanup.sql | docker exec -i supabase_db_MahjongFlow psql -X -U postgres -d postgres -v ON_ERROR_STOP=1
```

清理只匹配本批次的 20 个任务、9 个活动 UUID 与描述标记，不删除账号。若后来新增报名等记录引用这些活动，外键会拒绝删除并回滚整个事务，需先另行确认关联数据的处理方式。
