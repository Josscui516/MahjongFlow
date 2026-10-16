import Link from "next/link";
import { DinnerVerification } from "@/features/dinner-verification/DinnerVerification";
import { refreshDinnerVerification } from "@/features/dinner-verification/actions";
import { readDinnerVerification } from "@/features/dinner-verification/server";
import { requireAuthorised } from "@/lib/auth/authorization";
import { DinnerRosterManager } from "@/features/dinner-verification/DinnerRosterManager";
import { dinnerRosterService } from "@/features/dinner-verification/roster";
import { DinnerFeedback } from "@/features/dinner-verification/DinnerFeedback";

export default async function DinnerEventPage({ params }: Readonly<{ params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const access = await requireAuthorised();
  const [result, roster] = await Promise.all([
    readDinnerVerification(eventId),
    access.canManageAccounts ? dinnerRosterService.listForEvent(eventId) : null,
  ]);
  return <div className="space-y-6">
    <Link href="/dinner-verification" className="inline-block text-sm font-semibold text-emerald-700 underline underline-offset-4">← Choose another event</Link>
    {roster ? roster.ok ? <DinnerRosterManager eventId={eventId} items={roster.items} /> : <DinnerFeedback code={roster.code} /> : null}
    <DinnerVerification key={`${eventId}:${result.ok ? result.readAt : result.code}`} eventId={eventId} initialResult={result} refreshAction={refreshDinnerVerification} />
  </div>;
}
