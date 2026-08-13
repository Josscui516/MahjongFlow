import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";
import { getAuthenticatedUser } from "@/lib/auth/session";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
} as const;

export async function GET() {
  const authentication = await getAuthenticatedUser();

  if (!authentication.ok) {
    const status =
      authentication.error === AUTH_ERROR_CODES.INVALID_SESSION ? 401 : 503;

    return Response.json(
      { error: authentication.error },
      { headers: NO_STORE_HEADERS, status },
    );
  }

  return Response.json(
    { authenticated: true },
    { headers: NO_STORE_HEADERS },
  );
}
