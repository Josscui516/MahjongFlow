export type SupabasePublicEnvironment = Readonly<{
  publishableKey: string;
  url: string;
}>;

export type SupabaseAdminEnvironment = Readonly<{
  applicationUrl: string;
  secretKey: string;
  url: string;
}>;

function requirePublicEnvironmentValue(
  name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "NEXT_PUBLIC_SUPABASE_URL",
  value: string | undefined,
) {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

export function getSupabasePublicEnvironment(): SupabasePublicEnvironment {
  const url = requirePublicEnvironmentValue(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = requirePublicEnvironmentValue(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be an absolute URL.");
  }

  const isLoopbackHost = ["localhost", "127.0.0.1", "::1"].includes(
    parsedUrl.hostname,
  );

  if (parsedUrl.protocol !== "https:" && !isLoopbackHost) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS outside local development.",
    );
  }

  return { publishableKey, url: parsedUrl.toString().replace(/\/$/, "") };
}

function requireServerEnvironmentValue(
  name: "APP_BASE_URL" | "SUPABASE_SECRET_KEY",
  value: string | undefined,
) {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

function parseApplicationUrl(value: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("APP_BASE_URL must be an absolute URL.");
  }

  const isLoopbackHost = ["localhost", "127.0.0.1", "::1"].includes(
    parsedUrl.hostname,
  );

  if (parsedUrl.protocol !== "https:" && !isLoopbackHost) {
    throw new Error("APP_BASE_URL must use HTTPS outside local development.");
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export function getSupabaseAdminEnvironment(): SupabaseAdminEnvironment {
  const { url } = getSupabasePublicEnvironment();
  const secretKey = requireServerEnvironmentValue(
    "SUPABASE_SECRET_KEY",
    process.env.SUPABASE_SECRET_KEY,
  );
  const applicationUrl = parseApplicationUrl(
    requireServerEnvironmentValue("APP_BASE_URL", process.env.APP_BASE_URL),
  );

  return { applicationUrl, secretKey, url };
}
