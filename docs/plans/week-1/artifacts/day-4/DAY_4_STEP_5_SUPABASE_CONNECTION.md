# 第 4 天步骤 5：Supabase 开发环境连接记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 前一步：[第 4 天步骤 4：环境变量与安全忽略规则记录](DAY_4_STEP_4_ENVIRONMENT_AND_IGNORE_RULES.md)
> 配置指南：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 执行日期：2026-08-06
> 状态：步骤 5 已完成；Supabase 开发服务连接已验证

## 1. 执行结论

应用骨架现已通过 `@supabase/ssr` 和 `@supabase/supabase-js` 建立浏览器端与服务端
基础 client，并提供仅服务端运行的最小健康检查。开发服务器运行时访问
`/api/health/supabase` 返回 HTTP `200`、`status: ok` 和 `Cache-Control: no-store`，证明
当前公开开发配置能到达所选 Supabase 项目的 Auth 服务。

本步骤没有创建业务表、执行数据库查询、修改 Auth 配置或使用 server-only secret。
连接验证不会返回上游响应、项目地址、key 或原始错误，因此不能把凭据泄露到页面。

## 2. 依赖与客户端结构

| 路径或依赖 | 版本／责任 |
|---|---|
| `@supabase/ssr` | `0.12.4`；提供当前 Next.js browser/server client 工厂 |
| `@supabase/supabase-js` | `2.112.1`；Supabase JavaScript client |
| `src/lib/supabase/env.ts` | 验证并返回 URL 与 publishable key，不读取 secret |
| `src/lib/supabase/browser.ts` | 创建浏览器 client |
| `src/lib/supabase/server.ts` | 创建读取当前请求 cookie 的 request-scoped server client |
| `src/lib/supabase/connection.ts` | 通过 Auth settings endpoint 做无数据库、无缓存的可达性检查 |
| `src/app/api/health/supabase/route.ts` | 返回最小的 `service` 与 `status` 健康状态 |

浏览器 client 和普通 server client 均使用 publishable key，使后续数据库访问继续受
`anon`／`authenticated` 角色和 RLS 限制。`SUPABASE_SECRET_KEY` 未被任何应用模块读取。

## 3. 连接验证方式

本地开发服务器启动后，可访问：

```text
GET /api/health/supabase
```

成功响应只包含：

```json
{
  "service": "supabase",
  "status": "ok"
}
```

连接配置缺失、远程拒绝或网络不可达时，接口统一返回 HTTP `503` 和
`status: unavailable`。接口不返回失败分类、请求 URL、header、key、上游 body 或异常
message，响应也明确禁止缓存。

该检查验证 Supabase Auth 服务和 publishable key 可用，但不声称业务 schema、RLS、
migration 或用户会话已完成；这些内容仍按后续计划实施和验收。

## 4. Cookie 与认证边界

当前 server client 只读取 cookie，足以提供不提前实现认证业务的基础封装。第 2 周
接入 SSR 认证前，必须增加 response-aware proxy，并按当前 `@supabase/ssr` 约定实现
`getAll` 与 `setAll`，正确转发刷新后的 cookie 和 cache-control header。不得吞掉 cookie
写入错误，也不得用 secret key 替代会话刷新或 RLS。

## 5. 官方资料核对

本步骤按 Supabase 当前文档和更新记录核对实现：

- [Supabase SSR client](https://github.com/supabase/ssr)：当前 browser/server client 工厂；
- [Supabase JavaScript client](https://github.com/supabase/supabase-js)：JavaScript client 基线；
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)：
  publishable key、browser client、server client 和 cookie adapter 方式；
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)：publishable 与
  secret key 的信任边界。

当前更新记录还说明新项目可能不会自动通过 Data API 暴露表，并且 publishable key
不能依赖 REST OpenAPI root 做通用连接测试。因此本步骤使用无业务表依赖的 Auth
settings endpoint，不以数据库表暴露状态或 OpenAPI schema 作为前置条件。

## 6. 验证结果

| 检查 | 结果 |
|---|---|
| 直接远程可达性检查 | 通过；Auth settings endpoint 返回 HTTP `200` |
| 本地健康接口 | HTTP `200`，`service: supabase`，`status: ok` |
| 健康接口响应字段 | 仅 2 个非敏感字段 |
| 健康接口缓存策略 | `Cache-Control: no-store` |
| 本地主页浏览器检查 | 页面非空、无 Next.js 错误浮层 |
| 浏览器控制台 | 0 errors，0 warnings |
| 健康接口浏览器检查 | 正常显示最小 JSON，0 console errors |
| `npm run lint` | 通过 |
| `npm exec tsc -- --noEmit` | 通过 |
| `npm run build` | 通过；健康接口识别为动态 Route Handler |
| `npm audit --audit-level=high` | 通过；0 vulnerabilities |

所有连接与安全检查只报告状态，不打印 `.env.local`、项目 URL、key、token 或上游响应。

## 7. 常见失败原因

1. `.env.local` 缺少 URL 或 publishable key：按 `.env.example` 补齐并重启开发服务器；
2. URL 不是绝对 URL，或远程环境未使用 HTTPS：重新从项目 API settings 获取 URL；
3. key 与项目不匹配或已轮换：更新本机配置并重新运行健康检查；
4. 网络、DNS、防火墙或 Supabase 项目暂停：先检查项目状态与网络，再重试；
5. 健康接口成功但表查询失败：检查 migration、Data API exposure、RLS 和 policy，不要改用
   secret key 绕过问题；
6. SSR 登录后 session 无法刷新：检查第 2 周 proxy 的 cookie `getAll`／`setAll` 实现。

排查时不得把真实配置复制进终端命令、日志、截图、Issue 或 Pull Request。

## 8. 步骤 5 验收清单

- [x] 应用配置指向专用 Supabase 开发项目；
- [x] 已建立浏览器端和服务端 Supabase client 基础封装；
- [x] 普通 client 只使用 publishable key；
- [x] server-only secret 未进入客户端代码或连接路径；
- [x] 已添加无业务表依赖的最小连接验证；
- [x] 已启动应用并验证远程服务可达；
- [x] 错误响应不会泄露 URL、key、上游 body 或异常信息；
- [x] 已记录本地连接步骤、边界和常见失败原因；
- [x] lint、typecheck、build、audit 和浏览器检查通过。

步骤 5 已完成。下一步可以执行步骤 6，建立数据库迁移基线，但仍不得提前实现第 2 周
认证、业务表、RLS 或业务功能。
