export type SupabasePublicEnvironment = Readonly<{
  publishableKey: string;
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
