import { SecureRouteLoading } from "@/components/feedback";

export default function BackofficeLoading() {
  return (
    <SecureRouteLoading
      description="We are verifying your committee role before showing protected navigation and workspace content."
      title="Preparing the back office"
    />
  );
}
