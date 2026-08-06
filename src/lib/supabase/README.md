# Supabase clients

| File | Responsibility |
|---|---|
| `env.ts` | Validate and return only the browser-safe project URL and publishable key |
| `browser.ts` | Create a browser client through `@supabase/ssr` |
| `server.ts` | Create a request-scoped server client that reads the current cookie store |
| `connection.ts` | Perform a database-free, server-only Auth service reachability check |

The browser and normal server clients both use the publishable key so database requests remain
subject to RLS. No module in this directory reads `SUPABASE_SECRET_KEY`.

The current server client deliberately provides cookie reads only. Week 2 authentication work must
add a response-aware proxy that implements both `getAll` and `setAll`, including the cache-control
headers supplied by `@supabase/ssr`, before relying on server-side token refresh. Do not swallow
cookie-write errors or use a secret key as a substitute for session handling.
