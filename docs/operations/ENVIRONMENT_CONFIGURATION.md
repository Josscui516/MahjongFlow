# Environment configuration

> Project setup plan: [Day 4: Project setup and environment](../plans/week-1/DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> Security baseline: [Day 1 technology stack decision](../plans/week-1/artifacts/day-1/DAY_1_TECH_STACK_DECISION.md)
> Last checked: 2026-08-06
> Current state: local Supabase public values configured and development connection verified

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
5. leave `SUPABASE_SECRET_KEY` empty unless an approved server-only workflow explicitly needs it;
6. restart the Next.js development server after changing local values;
7. run the step 5 connection check without printing any value.

Do not paste project values into Markdown, chat, Issue descriptions, Pull Requests, screenshots,
test fixtures or committed configuration. Supabase CLI access tokens and database passwords are
CLI credentials, not application variables, and must not be stored in `.env.example`.

## 4. Vercel configuration

When Vercel access becomes available, configure the project URL and publishable key independently
for Preview and Production. Add a server-only secret only if its use has been reviewed. Do not copy
Production values into Preview by default, and do not use `vercel env pull` output as a committed file.

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

Vercel project creation permission is still unavailable, so step 7 remains blocked.

## 6. Safety checks

Before sharing or committing changes:

1. run `git check-ignore -v .env.local` and confirm an ignore rule matches;
2. run `git ls-files .env .env.local '.env.*'` and confirm no local environment file is tracked;
3. search tracked files for Supabase secret-key prefixes, service-role keys, tokens and passwords;
4. inspect browser code and build output to ensure `SUPABASE_SECRET_KEY` is absent;
5. confirm `.env.example` contains no real URL, key or project reference.
