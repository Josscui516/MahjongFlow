import { redirect } from "next/navigation";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { LoginShell } from "@/components/layout";
import { getSafeBackofficeRedirectPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ next?: string | string[] }>;
}>) {
  const { next } = await searchParams;
  const nextPath = getSafeBackofficeRedirectPath(next);
  const authentication = await getAuthenticatedUser();

  if (authentication.ok) {
    redirect(nextPath);
  }

  return (
    <LoginShell title="Back-office sign in">
      <LoginForm nextPath={nextPath} />
    </LoginShell>
  );
}
