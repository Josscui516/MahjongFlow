const FALLBACK_BACKOFFICE_PATH = "/dashboard";
const REDIRECT_ORIGIN = "https://mahjongflow.invalid";
const PROTECTED_BACKOFFICE_PATH_PREFIXES = [
  FALLBACK_BACKOFFICE_PATH,
  "/backoffice",
  "/meetings",
  "/tasks",
  "/events",
  "/registrations",
  "/attendance",
  "/dinner-verification",
  "/admin",
] as const;

function isProtectedBackofficePath(pathname: string) {
  return PROTECTED_BACKOFFICE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getSafeBackofficeRedirectPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return FALLBACK_BACKOFFICE_PATH;
  }

  try {
    const redirectUrl = new URL(value, REDIRECT_ORIGIN);
    const isSameOrigin = redirectUrl.origin === REDIRECT_ORIGIN;
    const isBackofficePath = isProtectedBackofficePath(redirectUrl.pathname);

    if (!isSameOrigin || !isBackofficePath) {
      return FALLBACK_BACKOFFICE_PATH;
    }

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return FALLBACK_BACKOFFICE_PATH;
  }
}
