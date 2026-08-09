import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function BackofficePage() {
  const authentication = await getAuthenticatedUser();

  if (!authentication.ok) {
    if (authentication.error === AUTH_ERROR_CODES.INVALID_SESSION) {
      redirect("/login?next=%2Fbackoffice");
    }

    return (
      <main className="mx-auto grid min-h-screen w-full max-w-2xl content-center gap-4 px-6 py-12">
        <h1 className="text-3xl font-semibold">Service unavailable</h1>
        <p>Authentication is temporarily unavailable. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-2xl content-center gap-6 px-6 py-12">
      <header className="grid gap-2">
        <p className="text-sm uppercase tracking-widest">MahjongFlow</p>
        <h1 className="text-3xl font-semibold">Back office</h1>
        <p>Your authenticated session is active.</p>
      </header>

      <div className="w-fit">
        <LogoutForm />
      </div>
    </main>
  );
}
