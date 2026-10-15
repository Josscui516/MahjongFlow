import { isPrivateIPv4 } from "@/lib/network/check-in-origin";

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
  const configuredUrl = requirePublicEnvironmentValue(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const sameOrigin = process.env.NEXT_PUBLIC_SUPABASE_SAME_ORIGIN === "true";
  const url = sameOrigin
    ? typeof window === "undefined" ? "http://kong:8000" : `${window.location.origin}/supabase`
    : configuredUrl;
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

  if (parsedUrl.protocol !== "https:" && !isLoopbackHost && !sameOrigin) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS outside local development.",
    );
  }

  return { publishableKey, url: parsedUrl.toString().replace(/\/$/, "") };
}

// Same-origin Docker transport must use the same cookie name in browser and server.
export function getSupabaseAuthOptions() {
  return process.env.NEXT_PUBLIC_SUPABASE_SAME_ORIGIN === "true"
    ? { storageKey: "mahjongflow-local-auth" } : {};
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

  const isLocalDevelopment = process.env.NODE_ENV === "development" && isPrivateIPv4(parsedUrl.hostname);

  if (parsedUrl.protocol !== "https:" && !isLoopbackHost
    && !(parsedUrl.protocol === "http:" && isLocalDevelopment)) {
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
