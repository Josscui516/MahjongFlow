# Environment configuration

> Project setup plan: [Day 4: Project setup and environment](../plans/week-1/DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> Security baseline: [Day 1 technology stack decision](../plans/week-1/artifacts/day-1/DAY_1_TECH_STACK_DECISION.md)
> New-member setup: [Root README](../../README.md#prerequisites)
> Last checked: 2026-08-07
> Current state: clean local install, Vercel Production and protected Preview connections verified

## 1. Configuration files

| File or platform | Tracked by Git | Purpose |
|---|---:|---|
| `.env.example` | Yes | Variable names, scope and safe comments only |
| `.env.local` | No | Current developer's local development values |
| `.env.development.local` | No | Optional developer-specific override with higher development priority |
| Vercel Preview settings | No | Preview deployment values, configured in Vercel |
| Vercel Production settings | No | Production values, configured separately in Vercel |

Next.js loads local environment files automatically. In development, a developer-specific
`.env.development.local` overrides `.env.local`; local files must never be committed.

## 2. Application variables

| Variable | Required when Supabase is connected | Browser-visible | Purpose |
|---|---:|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | HTTPS URL of the selected Supabase development project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Yes | Low-privilege project key used by browser and user-session clients |
| `SUPABASE_SECRET_KEY` | 完整账号管理／token 管理／公开签到需要 | Never | server-only 窄管理客户端；不能用于普通用户请求或浏览器 |
| `APP_BASE_URL` | 账号管理及签到管理客户端需要 | Never | 邀请／密码设置与活动 QR 的规范 origin；非本地使用 HTTPS |

Only variables prefixed with `NEXT_PUBLIC_` may be read by Client Components. Next.js inlines
those values into browser JavaScript at build time, so they must be treated as public.

The publishable key does not grant unrestricted database access. Every exposed table must enable
Row Level Security and use reviewed policies for `anon` and `authenticated`. The secret key bypasses
RLS and must never be used for normal user-session data access or browser clients. Approved public check-in handlers use it only through the narrow validated gateway described in section 7.

## 3. Obtaining development values

After the dedicated Supabase development project is created:

1. Open the project in the Supabase Dashboard;
2. Open the project's API settings or Connect dialog;
3. copy the project URL into `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`;
4. copy the publishable key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
5. set `SUPABASE_SECRET_KEY` only for the approved account-management server runtime;
6. set `APP_BASE_URL` to `http://localhost:3000` locally and the canonical HTTPS origin when deployed;
7. allow `${APP_BASE_URL}/account/password` in Supabase Auth redirect URLs;
8. restart the Next.js development server after changing local values;
9. run the step 5 connection check without printing any value.

Do not paste project values into Markdown, chat, Issue descriptions, Pull Requests, screenshots,
test fixtures or committed configuration. Supabase CLI access tokens and database passwords are
CLI credentials, not application variables, and must not be stored in `.env.example`.

## 4. Vercel configuration

The Supabase integration syncs Production. `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are also present in the Vercel Preview scope; their values
were not read or copied during verification. Supabase's full Preview credential sync remains disabled
because its confirmation would also add the service-role key, database password and Postgres
connection variables. Development sync remains off.

The current Supabase Free project does not provide database branching. The user explicitly approved
sharing the existing project with Preview at this stage. Production and Preview therefore reach the
same Supabase project even though their Vercel variables are separately scoped. Preview may use only
fictional data and non-destructive tests. Add a server-only secret only if its use has been reviewed,
and never expose secret, service-role or database password variables to browser code. Do not commit
output from `vercel env pull`.

## 5. Current state and limitation

The team confirmed on 2026-08-06 that the Supabase development project has been created and the
required project URL and publishable key have been added to the ignored `.env.local`. A safe local
check confirmed that both values are present and have recognised hosted-project shapes without
printing them. At that historical audit, the optional server-only secret remained empty; this is not a current configuration assertion.

Browser and request-scoped server clients are now configured with the publishable key. The
server-only `GET /api/health/supabase` check reached the development project's Auth service and
returned HTTP `200` without exposing configuration or upstream response details. This proves service
reachability only; it does not validate business tables, migrations, RLS policies or authenticated
sessions. See the [step 5 connection record](../plans/week-1/artifacts/day-4/DAY_4_STEP_5_SUPABASE_CONNECTION.md).

On 2026-08-07, a second copy cloned from remote `main` completed `npm ci`, local environment
configuration, development startup, root-page and health-endpoint checks, lint, typecheck and a
production build without reusing the original workspace's dependencies or build output. No
environment value was printed or recorded. See the
[step 9 clean-install record](../plans/week-1/artifacts/day-4/DAY_4_STEP_9_CLEAN_INSTALL_VERIFICATION.md).

Vercel Production is connected to `Josscui516/MahjongFlow`, uses `main`, and serves
<https://mahjong-flow.vercel.app>. After redeployment with the latest project settings, the root page
and `/api/health/supabase` both returned HTTP `200`. A protected Preview deployment was created from
the same verified source; its root page and health endpoint also returned HTTP `200` through
authenticated access. See the [deployment guide](VERCEL_DEPLOYMENT.md) and
[step 7 audit](../plans/week-1/artifacts/day-4/DAY_4_STEP_7_VERCEL_ENVIRONMENT_AUDIT.md).

## 6. Safety checks

Before sharing or committing changes:

1. run `git check-ignore -v .env.local` and confirm an ignore rule matches;
2. run `git ls-files .env .env.local '.env.*'` and confirm no local environment file is tracked;
3. search tracked files for Supabase secret-key prefixes, service-role keys, tokens and passwords;
4. inspect browser code and build output to ensure `SUPABASE_SECRET_KEY` is absent;
5. confirm `.env.example` contains no real URL, key or project reference.

## 7. 完整 MVP 配置与本轮核验边界（2026-09-30）

源码 `getSupabaseAdminEnvironment()` 同时要求 `SUPABASE_SECRET_KEY` 和 `APP_BASE_URL`，账号管理、活动 token 管理与公开签到 gateway 会调用它。只提供两项 public 变量可做普通协调／健康检查，不能据此宣称完整签到可运行。环境值必须通过私密渠道配置于忽略文件或平台，本轮未读取或重写值。Production SHA／CI／部署状态已核实，历史 Preview 共用数据库、变量同步和 clean install 记录仍只代表原日期，M6 需要重新确认。见[当前项目状态](../project/CURRENT_PROJECT_STATUS.md)。

## 8. 同一局域网内的手机报名测试

在忽略的 `.env.local` 中，`APP_BASE_URL` 保持本地规范 origin（例如 localhost 的端口 3000），然后使用 `npm run dev -- --hostname 0.0.0.0 --port 3000` 启动或重启前端。二维码的 origin 不固定为该 localhost：development 环境每次生成时读取当前物理网卡的 RFC 1918 私有 IPv4，排除 Docker／WSL 等虚拟网卡；如果访问活动页使用的 Host 是本机局域网地址，则优先使用这个网卡，否则选择检测到的第一个物理局域网地址。端口取自合法本地请求，缺失时取规范 origin 的端口。没有局域网地址时明确失败，不生成手机无法访问的 localhost 二维码。

生产／预览部署使用各环境配置的 HTTPS `APP_BASE_URL`，不读取服务器内网 IP，不信任请求 Host 来改写正式链接。相同代码部署到不同机器／域名，无需修改源码中的 IP。邀请和密码恢复仍使用规范 origin，二维码的本地地址识别不改变它们。

本机运行生产构建（`npm run build` 后 `npm start`）时，`APP_BASE_URL` 仍可使用 `http://localhost:3000`。只有配置指向 HTTP loopback，且请求 Host 为 loopback 或本机已识别的物理局域网地址时，才按本地预览处理并生成 LAN 二维码；不能仅凭 `NODE_ENV=production` 将这种本机运行误判为正式部署。公开域名或外部 Host 不触发此例外。Docker 同源模式仍要求启动脚本提供宿主机 IP，不会把容器内部地址用作二维码目标。

手机与电脑须在同一可互通局域网，Windows 防火墙须允许私有网络中该前端端口的入站连接。无需向手机暴露 Supabase 管理密钥或数据库端口；公开报名通过前端服务端入口访问本地数据库。

在活动详情中生成新的二维码，其链接使用动态识别的局域网 origin。旧二维码仍包含旧 origin，更新配置不会重写已经保存的图片；轮换会撤销该活动的旧 token。开发电脑 IP 改变后重新生成即可；重启开发服务会刷新 Next.js 开发资源允许的 origin 列表。

二维码用于新用户自助报名：填写姓名、邮箱、活动要求的学号及隐私同意后创建报名，无需先由工作人员登记。报名不会产生签到或晚餐资格。晚餐独立使用管理员预录名册。业务决定和部署／回退见[需求纠正](../project/REGISTRATION_AND_DINNER_CORRECTION.md)。

## 2026-10-21 本地手机扫码地址与分享体验

本地 QR 使用 `start-local.ps1` 从宿主机当前默认网卡获取的 `LOCAL_DOCKER_HOST_IP`，不使用 Docker 容器接口。校园 Wi-Fi 可以直接分配公网 IPv4，因此本地显式设置允许有效的非 loopback、非 link-local、非 multicast IPv4，而不局限于 RFC1918 私有地址。该值只来自服务端启动配置，不接受任意请求 Host；Docker 模式缺失宿主地址时拒绝生成，避免回退至容器地址。切换 Wi-Fi 或 IP 后重新运行启动脚本以刷新地址。

Next.js 开发资源只额外允许该明确网卡地址，不使用通配来源；正式 HTTPS 部署继续使用 `APP_BASE_URL`，不受本地网络选择影响。本次不修改防火墙、数据库 schema、角色权限或 RLS，不执行远程部署。

前端生成后收起时间设置，保留 Sydney 时段摘要和 Edit times；结果区提供 Copy link、Download QR 与一次性保存提示。HTTP 局域网不支持安全 Clipboard API 时使用本地选区复制后备方式；失败时提示手动复制。替换／撤销通过页面内模态确认，取消不发请求；确认后原链接失效。刷新后的活跃链接仅显示状态，明文及二维码仍不持久化到服务端。

验证使用临时虚构活动：新链接及下载 PNG 解码地址均指向宿主网卡，浏览器通过该地址打开公开报名表。Joshua 确认同一 Wi-Fi 手机能访问登录页面。复制显示 Copied，PNG 文件成功生成及解码；替换／撤销的取消与确认路径、编辑时间后重新保存均进行浏览器验证。测试活动和下载文件验证后清理。

回退代码后重建本地前端；保留现有数据库和 token 审计记录。旧下载图片里的地址不会自动更改，需在活动中明确生成替换链接后重新分享；已有可用链接不由本次开发自动轮换。
