const FALLBACK_BACKOFFICE_PATH = "/backoffice";
const REDIRECT_ORIGIN = "https://mahjongflow.invalid";

export function getSafeBackofficeRedirectPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return FALLBACK_BACKOFFICE_PATH;
  }

  try {
    const redirectUrl = new URL(value, REDIRECT_ORIGIN);
    const isSameOrigin = redirectUrl.origin === REDIRECT_ORIGIN;
    const isBackofficePath =
      redirectUrl.pathname === FALLBACK_BACKOFFICE_PATH ||
      redirectUrl.pathname.startsWith(`${FALLBACK_BACKOFFICE_PATH}/`);

    if (!isSameOrigin || !isBackofficePath) {
      return FALLBACK_BACKOFFICE_PATH;
    }

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return FALLBACK_BACKOFFICE_PATH;
  }
}
