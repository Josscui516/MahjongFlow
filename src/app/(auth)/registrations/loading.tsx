import { SecureRouteLoading } from "@/components/feedback";

export default function RegistrationsLoading() {
  return (
    <SecureRouteLoading
      description="We are verifying authorised access before preparing participant registration information."
      title="Preparing registrations"
    />
  );
}
