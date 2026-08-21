export type PasswordSetupLinkType = "invite" | "recovery";

type PasswordSetupTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
  type: PasswordSetupLinkType;
}>;

export type PasswordAuthClient = Readonly<{
  auth: Readonly<{
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: unknown | null;
    }>;
    setSession: (tokens: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{
      data: { user: { id: string } | null };
      error: unknown | null;
    }>;
    updateUser: (attributes: { password: string }) => Promise<{
      error: unknown | null;
    }>;
  }>;
}>;

export type EstablishPasswordSessionResult =
  | Readonly<{ status: "ready"; userId: string }>
  | Readonly<{ status: "unavailable" }>;

export type PasswordSessionInitializer = () => Promise<EstablishPasswordSessionResult>;

export type UpdatePasswordResult =
  | "SESSION_MISMATCH"
  | "SUCCESS"
  | "UPDATE_FAILED";

export function parsePasswordSetupLink(hash: string): PasswordSetupTokens | null {
  const parameters = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");
  const type = parameters.get("type");

  if (
    !accessToken ||
    !refreshToken ||
    (type !== "invite" && type !== "recovery")
  ) {
    return null;
  }

  return { accessToken, refreshToken, type };
}

export async function establishPasswordSetupSession(
  client: PasswordAuthClient,
  hash: string,
): Promise<EstablishPasswordSessionResult> {
  const tokens = parsePasswordSetupLink(hash);

  if (!tokens) {
    return { status: "unavailable" };
  }

  const { data, error } = await client.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  if (error || !data.user) {
    return { status: "unavailable" };
  }

  return { status: "ready", userId: data.user.id };
}

export function createPasswordSessionInitializer(
  client: PasswordAuthClient,
  hash: string,
): PasswordSessionInitializer {
  let attempt: Promise<EstablishPasswordSessionResult> | null = null;

  return () => {
    attempt ??= establishPasswordSetupSession(client, hash);
    return attempt;
  };
}

export async function updatePasswordForTarget(
  client: PasswordAuthClient,
  targetUserId: string,
  password: string,
): Promise<UpdatePasswordResult> {
  const { data, error: userError } = await client.auth.getUser();

  if (userError || !data.user || data.user.id !== targetUserId) {
    return "SESSION_MISMATCH";
  }

  const { error } = await client.auth.updateUser({ password });

  return error ? "UPDATE_FAILED" : "SUCCESS";
}
