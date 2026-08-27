import { LoginShell } from "@/components/layout";

import { PasswordSetupForm } from "./password-form";

export default function AccountPasswordPage() {
  return (
    <LoginShell
      description="Open this page from your invitation or password-recovery email. Choose a password known only to you; account administrators cannot view it."
      title="Set your password"
    >
      <PasswordSetupForm />
    </LoginShell>
  );
}
