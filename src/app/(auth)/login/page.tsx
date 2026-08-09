import { redirect } from "next/navigation";

import { LoginForm } from "@/app/(auth)/login/login-form";
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
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 px-6 py-12">
      <header className="grid gap-2">
        <p className="text-sm uppercase tracking-widest">MahjongFlow</p>
        <h1 className="text-3xl font-semibold">Back-office sign in</h1>
        <p>Use your committee account to continue.</p>
      </header>

      <LoginForm nextPath={nextPath} />
    </main>
  );
}
