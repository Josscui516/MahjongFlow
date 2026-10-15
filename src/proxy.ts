import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { resolveAuthenticatedUser } from "@/lib/auth/authenticated-user";
import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";
import { getSafeBackofficeRedirectPath } from "@/lib/auth/redirect";
import { getSupabasePublicEnvironment, getSupabaseAuthOptions } from "@/lib/supabase/env";

const AUTH_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

function applyAuthState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));

  AUTH_CACHE_HEADERS.forEach((name) => {
    const value = source.headers.get(name);

    if (value !== null) {
      target.headers.set(name, value);
    }
  });

  return target;
}

function createUnauthenticatedResponse(
  request: NextRequest,
  authResponse: NextResponse,
) {
  if (request.nextUrl.pathname.startsWith("/api/backoffice")) {
    return applyAuthState(
      authResponse,
      NextResponse.json(
        { error: AUTH_ERROR_CODES.INVALID_SESSION },
        { status: 401 },
      ),
    );
  }

  const requestedPath = getSafeBackofficeRedirectPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", requestedPath);

  return applyAuthState(
    authResponse,
    NextResponse.redirect(loginUrl, { status: 307 }),
  );
}

function createServiceUnavailableResponse(
  request: NextRequest,
  authResponse: NextResponse,
) {
  if (request.nextUrl.pathname.startsWith("/api/backoffice")) {
    return applyAuthState(
      authResponse,
      NextResponse.json(
        { error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
        { status: 503 },
      ),
    );
  }

  return applyAuthState(
    authResponse,
    new NextResponse("Authentication service is temporarily unavailable.", {
      status: 503,
    }),
  );
}

export async function proxy(request: NextRequest) {
  let authResponse = NextResponse.next({ request });

  const authentication = await resolveAuthenticatedUser(async () => {
    const { publishableKey, url } = getSupabasePublicEnvironment();
    const supabase = createServerClient(url, publishableKey, {
      auth: getSupabaseAuthOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          authResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, options, value }) => {
            authResponse.cookies.set(name, value, options);
          });
          Object.entries(headersToSet).forEach(([name, value]) => {
            authResponse.headers.set(name, value);
          });
        },
      },
    });

    return supabase.auth.getUser();
  });

  authResponse.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );

  if (!authentication.ok) {
    return authentication.error === AUTH_ERROR_CODES.INVALID_SESSION
      ? createUnauthenticatedResponse(request, authResponse)
      : createServiceUnavailableResponse(request, authResponse);
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/backoffice/:path*",
    "/dashboard/:path*",
    "/meetings/:path*",
    "/tasks/:path*",
    "/events/:path*",
    "/registrations/:path*",
    "/attendance/:path*",
    "/admin/:path*",
    "/dinner-verification/:path*",
    "/api/backoffice/:path*",
  ],
};
