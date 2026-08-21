import { SecureRouteLoading } from "@/components/feedback";

export default function AccountPasswordLoading() {
  return (
    <SecureRouteLoading
      description="We are preparing a secure password session from your invitation or recovery link."
      title="Preparing password setup"
    />
  );
}
