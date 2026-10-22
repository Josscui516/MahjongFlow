> 2026-10-22 最新决定：移除独立 `/dinner-roster` 页面、维护表单及对应 Server Actions；旧地址返回 404。活动晚餐核验与发放保留。历史数据库表及内部兼容读取代码保留，不删除既有资格和发放记录；无需 schema migration。下方独立名册页面说明为历史记录。

> 2026-10-22：活动页使用确认到场勾选清单，移除共享名册匹配、刷新按钮、焦点／可见性自动刷新和过期定时器。勾选保存成功后更新本地状态；错误保留原勾选。顶部统计已勾选人数。部署和回退见 `docs/project/DINNER_CHECK_IN_EMAIL_MATCHING.md` 最新决定，下方为历史实现说明。

# 通用晚餐资格与活动发放

2026-10-20 [最新权限](../../../docs/project/DINNER_PERMISSION_BOUNDARIES.md)：所有活跃后台成员可核验和记录本场发放，只有 authorised 可看完整名册，名册维护继续额外要求管理员能力。下方旧权限描述按原日期理解。

通用资格与发放以[2026-10-18 决定](../../../docs/project/DINNER_CHECK_IN_EMAIL_MATCHING.md)为准；扫码按[2026-10-21 决定](../../../docs/project/QR_REGISTRATION_STAFF_ATTENDANCE.md)仅注册，工作人员确认到场后才参与领取资格匹配。

`/dinner-roster` 是独立的通用资格录入页面，无活动参数；管理员录入一次，持续用于所有活动。`roster.ts` 维护通用表，不消耗资格。原活动名册数据只保留历史，活跃邮箱由迁移去重转入通用表。

`/dinner-verification/[eventId]` 是本场可领取与已发放列表。`matched-attendance.ts` 通过真实会话读取 SECURITY INVOKER 函数，合并当前报名／确认签到／通用资格与本场发放记录。`server.ts` 投影最小 DTO，不泄漏学号、操作者或 Auth 信息。撤销签到后已发放记录仍可见，避免丢失已服务事实。

`issuance.ts` 和 `issuance-action.ts` 执行 authorised 鉴权、输入校验及安全错误映射。原子写函数检查活跃身份，锁定当前活动和首次发放的资格事实，同活动同人联合主键保证幂等。发放时间／操作者由数据库生成；浏览器勾选在服务器确认和刷新成功后显示，失败不假报成功。清除误勾需要确认，修改审计保留。

刷新期间禁用发放操作，过期／失败结果明确提示，权限丢失清空身份；请求序号防止旧结果覆盖新结果。资格管理仅管理员，授权工作人员可以记录活动发放，普通委员／匿名／停用用户拒绝。

`database.test.ts` 使用 ISSUE35_LIVE_DATABASE=1 运行真实本地回归，包括重复并发发放。`supabase/tests/rls/dinner_check_in_matching.sql` 覆盖通用资格跨活动、已发放保留、明确更正、权限和不允许直接表写入。evidence 下 dinner-global 三张截图为当前版本，其余旧截图按原日期理解。
