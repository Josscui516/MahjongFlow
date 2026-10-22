import Link from "next/link";
import { DinnerFeedback } from "@/features/dinner-verification/DinnerFeedback";
import { DinnerVerification } from "@/features/dinner-verification/DinnerVerification";
import { readDinnerVerification } from "@/features/dinner-verification/server";
import { AuthorizationError, requireAuthorised } from "@/lib/auth/authorization";
import { setDinnerIssued } from "@/features/dinner-verification/issuance-action";

export default async function DinnerEventPage({ params }: Readonly<{ params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  try { await requireAuthorised(); }
  catch (error) { return <DinnerFeedback code={error instanceof AuthorizationError ? error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "PERMISSION_DENIED" : "SYSTEM_ERROR"} />; }
  const result = await readDinnerVerification(eventId);
  return <div className="mx-auto w-full max-w-5xl space-y-5">
    <nav aria-label="Dinner navigation" className="flex flex-wrap gap-x-5 text-sm font-semibold text-emerald-900">
      <Link className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2" href={`/events/${eventId}`}>Back to event</Link>
    </nav>
    <DinnerVerification key={`${eventId}:${result.ok ? result.readAt : result.code}`} eventId={eventId} initialResult={result} issueAction={setDinnerIssued} />
  </div>;
}
