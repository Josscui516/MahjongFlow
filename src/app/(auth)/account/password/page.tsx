import { LoginShell } from "@/components/layout";

import { PasswordSetupForm } from "./password-form";

export default function AccountPasswordPage() {
  return (
    <LoginShell>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Committee account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Set your password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Open this page from your invitation or password-recovery email. Choose a
          password known only to you; account administrators cannot view it.
        </p>
        <div className="mt-7">
          <PasswordSetupForm />
        </div>
      </section>
    </LoginShell>
  );
}
