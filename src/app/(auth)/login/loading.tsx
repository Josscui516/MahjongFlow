import { SecureRouteLoading } from "@/components/feedback";

export default function LoginLoading() {
  return (
    <SecureRouteLoading
      description="We are checking whether you already have a valid committee session."
      title="Preparing sign in"
    />
  );
}
