import Link from "next/link";
import { DinnerVerification } from "@/features/dinner-verification/DinnerVerification";
import { refreshDinnerVerification } from "@/features/dinner-verification/actions";
import { readDinnerVerification } from "@/features/dinner-verification/server";
import { requireAuthorised } from "@/lib/auth/authorization";
import { DinnerRosterManager } from "@/features/dinner-verification/DinnerRosterManager";

export default async function DinnerEventPage({ params }: Readonly<{ params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const access = await requireAuthorised();
  const result = await readDinnerVerification(eventId);
  return <div className="space-y-6">
    <Link href="/dinner-verification" className="inline-block text-sm font-semibold text-emerald-700 underline underline-offset-4">← Choose another event</Link>
    {access.canManageAccounts && result.ok ? <DinnerRosterManager eventId={eventId} items={result.items} /> : null}
    <DinnerVerification key={`${eventId}:${result.ok ? result.readAt : result.code}`} eventId={eventId} initialResult={result} refreshAction={refreshDinnerVerification} />
  </div>;
}
