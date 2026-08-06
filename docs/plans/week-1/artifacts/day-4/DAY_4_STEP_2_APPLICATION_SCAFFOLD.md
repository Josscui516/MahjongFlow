# 第 4 天步骤 2：应用骨架初始化记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 前置检查：[第 4 天步骤 1：环境前置条件检查记录](DAY_4_STEP_1_ENVIRONMENT_PREREQUISITE_CHECK.md)
> 技术基线：[第 1 天核心技术栈决策记录](../day-1/DAY_1_TECH_STACK_DECISION.md)
> 执行日期：2026-08-06
> 状态：步骤 2 已完成

## 1. 执行结论

已在现有仓库中建立可运行的 Next.js App Router 应用骨架，并保留原有
`docs/`、`README.md`、`.gitignore`、`AGENTS.md` 和 `.github/` 内容。项目使用
TypeScript、Tailwind CSS、ESLint、`src/` 目录、`@/*` import alias 和 npm。

开发服务器已在 `http://localhost:3000` 启动，并通过真实浏览器验证初始页面。
lint、独立 TypeScript 检查和生产构建均通过。

## 2. 初始化方式

执行前通过 Context7 和 `create-next-app --help` 核对当前官方参数。为避免覆盖
现有仓库文件，先在仓库内的临时目录生成项目，再只迁入应用所需文件。采用的
初始化选项为：

```text
TypeScript
Tailwind CSS
ESLint
App Router
src/ directory
@/* import alias
npm
disable Git initialization
non-interactive defaults
```

生成器创建的 README、AGENTS、CLAUDE 和 `.gitignore` 没有覆盖仓库现有文件。
所需应用文件迁移完成后，临时脚手架副本已移至系统临时目录作为可恢复备份，
未留在仓库工作树中。

## 3. 锁定的运行时与依赖

| 项目 | 采用版本／规则 |
|---|---|
| Node.js | `24.x`；本机验证版本 `24.18.0` |
| npm | `11.16.0` |
| Next.js | `16.3.0` |
| React | `19.2.8` |
| React DOM | `19.2.8` |
| TypeScript | lockfile 解析为 `5.9.3` |
| Tailwind CSS | v4；lockfile 解析为 `4.3.3` |
| ESLint | v9；lockfile 解析为 `9.39.5` |

版本约束记录在 `package.json`，精确安装结果由 `package-lock.json` 固定。
`.nvmrc` 记录本次验证的 Node.js 版本，`packageManager` 字段记录 npm 版本。
没有生成或保留 pnpm、Yarn 或 Bun lockfile。

## 4. 生成的应用文件

| 路径 | 用途 |
|---|---|
| `src/app/` | App Router 初始页面、根布局、全局样式和 favicon |
| `public/` | 官方初始页面使用的静态 SVG 资源 |
| `package.json` | scripts、依赖、Node.js engine 和包管理器声明 |
| `package-lock.json` | npm 依赖锁文件 |
| `tsconfig.json` | TypeScript 严格模式和 `@/*` alias |
| `next.config.ts` | Next.js 配置入口 |
| `eslint.config.mjs` | Next.js ESLint 配置 |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS 配置 |
| `.nvmrc` | 本地 Node.js 精确版本提示 |

`next-env.d.ts` 为 Next.js 自动生成文件，已加入 `.gitignore`，不作为手工维护的
项目源文件。

## 5. 验证结果

| 检查 | 命令／方式 | 结果 |
|---|---|---|
| 依赖安装 | `npm install --package-lock-only` | 通过；359 个包审计，0 个已知漏洞 |
| 依赖树 | `npm ls --depth=0` | 通过；无缺失或无效依赖 |
| lint | `npm run lint` | 通过；0 个错误 |
| TypeScript | `npm exec tsc -- --noEmit` | 通过；0 个错误 |
| 生产构建 | `npm run build` | 通过；`/` 和 `/_not-found` 成功静态生成 |
| 开发服务器 | `npm run dev` | 通过；`http://localhost:3000` 返回成功页面 |
| 浏览器页面 | Playwright 打开首页并读取 snapshot | 通过；标题为 `Create Next App`，正文正常 |
| 空白页检查 | 浏览器读取 `document.body.innerText` | `HAS_CONTENT` |
| 错误覆盖层 | 检查 Next.js error overlay | `OK` |
| 控制台 | 浏览器 console error 检查 | 0 errors，0 warnings |
| 视觉检查 | 浏览器截图目视检查 | 通过；官方初始页面布局完整 |

原计划使用 `agent-browser` 完成浏览器验证，但当前环境没有该 CLI。按验证技能的
回退规则使用 Playwright 完成同等检查。浏览器与开发服务器在验证结束后均已关闭。

首次 lint/独立 typecheck 扫描到了尚未移出仓库的临时脚手架 `.next/types`，因而
报告生成文件问题；迁移完成并移走临时目录后重新执行，两项均通过。应用源码无需
为生成文件修改规则。

npm 输出一项非阻断警告：`unrs-resolver` 存在未批准的 install script。项目在未
批准该脚本的情况下仍完成 lint、typecheck 和 production build，因此本步骤没有
扩大第三方脚本执行权限；后续依赖安全检查可再次评估。

## 6. 文件保护和范围检查

- 现有 `docs/`、`.github/`、`AGENTS.md` 和项目 README 未被生成器覆盖；
- README 只更新当前项目状态和已锁定版本，未替换为生成器模板；
- `.gitignore` 保留原有密钥、环境文件、Supabase、Vercel 和数据库数据保护规则；
- 没有创建 Supabase 或 Vercel 项目，没有写入任何环境值；
- 没有实现登录、会议、任务、活动、报名、签到或晚餐核验业务功能；
- 没有执行 Git 分支、暂存、提交、推送或 Pull Request 操作。

## 7. 步骤 2 验收清单

- [x] 已在现有仓库中初始化 Next.js 与 TypeScript；
- [x] 已启用 Tailwind CSS v4；
- [x] 已采用冻结的 App Router；
- [x] 已统一使用 npm `11.16.0`；
- [x] 已启动开发服务器；
- [x] 已在真实浏览器打开并验证初始页面；
- [x] 已确认没有覆盖现有项目文档和协作规则；
- [x] 已保存 `package-lock.json`；
- [x] lint、typecheck 和 production build 已通过；
- [x] 未引入业务功能、密钥或真实参与者数据。

步骤 2 已满足“开发服务器正常启动、初始页面可访问、终端无阻断错误”的检查要求。
下一步可以执行步骤 3，按已批准的仓库结构建立标准目录骨架。
