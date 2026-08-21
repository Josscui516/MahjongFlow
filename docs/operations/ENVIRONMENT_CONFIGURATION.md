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
| `SUPABASE_SECRET_KEY` | No | Never | Optional narrow server-only administration path that bypasses RLS |
| `APP_BASE_URL` | When account management is enabled | Never | Canonical origin for invitation and password-recovery redirects; HTTPS outside local development |

Only variables prefixed with `NEXT_PUBLIC_` may be read by Client Components. Next.js inlines
those values into browser JavaScript at build time, so they must be treated as public.

The publishable key does not grant unrestricted database access. Every exposed table must enable
Row Level Security and use reviewed policies for `anon` and `authenticated`. The secret key bypasses
RLS and must never be used for normal user requests, browser clients or public Route Handlers.

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
printing them. The optional server-only secret remains empty.

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
