# 本地 Docker 服务统一管理

适用于已配置的 MahjongFlow Windows 本地环境。统一分组为 `mahjongflow`；Supabase CLI 的 `project_id` 仍为 `MahjongFlow`，原容器名、数据库卷、内部网络别名及对外端口保持一致。本配置不改变云端环境、Schema、RLS 或 migration。

## 启动与停止

在仓库根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-local.ps1
```

默认启动生产构建模式。日常修改代码时使用开发模式，前端与 Supabase 仍全部运行于 Docker：

```powershell
# 首次启动开发模式，或更新依赖、Dockerfile、镜像内配置后
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1 -Mode Development -Build
# 后续启动开发模式
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1 -Mode Development
# 构建并切换到生产模式进行验收
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1 -Mode Production -Build
```

两种模式共用同一个前端容器和端口，不同时运行。开发模式使用 [开发覆盖配置](../../compose.dev.yaml) 和 Dockerfile 的 `development` 阶段，运行 `next dev`；`src`、`public` 以只读方式挂载，组件、页面和样式修改无需重建，Next.js 自动更新浏览器。依赖与 `.next` 缓存位于容器内，不挂载 Windows 的 `node_modules`，也不挂载宿主机环境文件。依赖、根目录配置（如 `next.config.ts`、`tsconfig.json`）在镜像中，修改后需加 `-Build`。`public` 资源更新后浏览器可能仍需刷新才能重新请求资源。

生产模式保持原有 standalone 构建，没有源码挂载；应用代码变化后使用 `-Mode Production -Build`。默认命令和旧的 `-Build` 用法继续表示生产模式。Docker Desktop 的启动／停止按钮会保留最近创建容器的模式；需要切换模式时使用启动脚本。

启动脚本刷新宿主机局域网 IP，等待核心服务健康后再启动网页。更换网络后运行启动脚本以刷新二维码地址。本机实测 Windows 挂载能读到源码变化，但原生文件事件与 Turbopack 轮询均未可靠更新页面，因此 Docker 开发模式使用 `next dev --webpack`，并设置 `LOCAL_DOCKER_POLLING=true`，以 `watchOptions.pollIntervalMs: 1000` 检查变化。这会增加文件检查开销；在文件事件正常的其他环境可移除该环境变量。生产模式不启用轮询，继续使用原有 Turbopack 构建。切换打包器后，旧标签页可能持有旧的开发客户端，需刷新或重新打开页面一次；同一开发模式下的源码修改无需手动刷新。

所有保留容器采用 `unless-stopped`：Docker 重启可恢复此前运行的服务，主动停止后则保持停止。停止不删除容器或数据卷。

## 保留的 8 个容器

| Compose 服务 | 用途 | 本机入口 |
|---|---|---|
| `frontend` | Next.js 网页及应用服务端入口 | <http://localhost:3000> |
| `db` | 原 PostgreSQL 数据库 | 端口 `45322` |
| `auth` | 登录、会话、账号邀请与密码恢复 | 通过网关 |
| `rest` | PostgREST 数据访问与 RPC | 通过网关 |
| `kong` | 浏览器与服务端统一 API 网关 | <http://localhost:45321> |
| `inbucket` | Mailpit 本地邀请／密码邮件接收 | <http://localhost:45324> |
| `pg_meta` | Studio 数据库元数据接口 | 内部网络 |
| `studio` | 本地数据库管理页面 | <http://localhost:45323> |

移除的服务容器为 Realtime、Storage、Edge Runtime 和 Analytics。源码没有使用 `.channel()`、Storage API 或 `functions.invoke()`；业务写入与二维码处理由 Next.js 服务端和 PostgreSQL 实现。`supabase/config.toml` 禁用这四项能力及 Storage Vector；Studio 隐藏日志功能。2026-10-21 根据用户后续要求，确认没有容器引用后，已删除 `supabase_storage_MahjongFlow` 和 `supabase_edge_runtime_MahjongFlow` 数据卷；当前项目保留 `supabase_db_MahjongFlow` 数据库卷，不删除数据库中的系统 schema、表或扩展。

## 配置与数据保留机制

- [启动脚本](../../start-local.ps1)检查必需容器、启动 Docker、获取本地凭据并刷新局域网 IP。
- [服务管理脚本](../../supabase/local-stack.mjs)从现有容器读取准确的镜像、环境、命令、健康检查、挂载、端口与网络别名，生成 Compose 服务定义。它在停机前校验配置往返一致性；首次迁移仅移除容器外壳，再由 Compose 创建统一分组。
- [Compose 主文件](../../compose.yaml)定义网页及现有外部网络；自动生成的 `supabase/.temp/compose.runtime.json` 补充七个 Supabase 服务及依赖顺序。生成文件使用变量引用，具体运行参数仅保存在被忽略的 `compose.local.env` 中。
- 数据库卷声明为外部卷 `supabase_db_MahjongFlow`，不会因 Compose 项目名变化而创建空库。原有只读密钥挂载与 CLI 生成的网关配置继续使用；不要清除 `supabase/.temp/start-secrets/`。
- 日常使用上述脚本；`npm run db:start` 属于 CLI 首次配置入口，不能代替统一环境启动脚本。CLI 删除／重建容器后需重新运行统一启动脚本。`npm run db:stop` 会移除 CLI 管理的容器，因此日常停止使用 `stop-local.ps1`。

运行参数可包含本地凭据，不输出、提交或分享 `compose.local.env`，也不公开完整 `docker inspect` 或 `docker compose config` 内容。

## 故障恢复与回退

启动脚本在必需容器缺失、原数据库卷或密钥挂载不符合预期时停止。若首次重分组在移除旧容器后中断，但生成配置和原数据库卷仍在，可使用原生成配置恢复：

```powershell
docker compose --project-name mahjongflow --env-file compose.local.env -f compose.yaml -f supabase/.temp/compose.runtime.json up -d --wait --wait-timeout 180
```

此命令挂载原外部数据库卷，不执行 reset、migration 或 seed。恢复后再运行 `start-local.ps1`。如需恢复某项可选服务，应先确认实际用例，再调整配置并通过 Supabase CLI 的受控重建流程恢复；Storage 和 Edge Runtime 的旧卷已按用户要求删除，重新启用时需要创建新卷，不能从旧卷恢复内容。不要用 `down -v`、`volume prune` 或 `stop --no-backup` 作为启动故障修复。

## 验证

脚本转换回归检查：

```powershell
node --test supabase/local-stack.test.mjs
npx eslint supabase/local-stack.mjs supabase/local-stack.test.mjs
node supabase/local-stack.mjs start --check
```

最后一条会刷新被忽略的运行配置并校验参数，不启动、停止或删除容器。集成验证须检查统一分组只有上述 8 个容器，应用健康端点、Auth、REST、Studio 与邮件服务可达，并实际运行一次停止／启动循环。数据保留须对比迁移前后的 PostgreSQL system identifier、原数据卷挂载以及全部业务表的行数；不输出业务记录或凭据。

2026-10-21 本机验证结果：

- 转换回归测试 5 项通过，脚本 ESLint、PowerShell 语法、Markdown 链接及 diff 空白检查通过。
- 首次迁移前后保留服务的环境变量、命令和挂载指纹一致；Studio 日志开关按计划关闭。PostgreSQL system identifier 与全部 16 张业务表的行数一致。
- 完整停止／启动循环通过：停止后目标运行容器为 0，重启后 `docker compose ls` 仅显示 `mahjongflow`、`running(8)`，数据库标识不变。
- `/login`、`/api/health/supabase`、Auth health、Studio 和 Mailpit 均返回 HTTP 200。对晚餐资格表执行不返回记录的 REST 查询，匿名访问返回 401，既有服务端角色返回 200；未调整权限。
- 本轮仅修改本地运维配置与脚本，没有修改应用代码，因此未重建 Next.js 镜像或执行应用全量测试；未执行 reset、seed 或 migration。

### 开发热更新配置补充验证

- 开发模式实测采用 Webpack 与 1000ms 文件检查。已在浏览器打开 Dashboard 后临时修改副标题；未手动刷新页面即显示修改，恢复副标题也自动更新。修改期间前端容器 ID 不变，重启次数为 0。临时文案已撤回。
- 生产镜像重新构建并启动成功；确认 `NODE_ENV=production`、无源码挂载，浏览器可正常打开 Dashboard。随后切回开发模式。
- 两种模式继续共用原本 7 个 Supabase 服务，未执行 reset、seed、migration 或业务数据写入。
