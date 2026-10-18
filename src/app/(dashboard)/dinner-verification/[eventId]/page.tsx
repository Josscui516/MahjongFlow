import Link from "next/link";
import { DinnerVerification } from "@/features/dinner-verification/DinnerVerification";
import { refreshDinnerVerification } from "@/features/dinner-verification/actions";
import { readDinnerVerification } from "@/features/dinner-verification/server";
import { requireAuthorised } from "@/lib/auth/authorization";
import { setDinnerIssued } from "@/features/dinner-verification/issuance-action";

export default async function DinnerEventPage({ params }: Readonly<{ params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const access = await requireAuthorised();
  const result = await readDinnerVerification(eventId);
  return <div className="space-y-6">
    <nav className="flex flex-wrap gap-5 text-sm font-semibold text-emerald-700 underline underline-offset-4">
      <Link href="/dinner-verification">← Choose another event</Link>
      {access.canManageAccounts ? <Link href="/dinner-roster">Manage shared dinner eligibility roster</Link> : null}
    </nav>
    <DinnerVerification key={`${eventId}:${result.ok ? result.readAt : result.code}`} eventId={eventId} initialResult={result} refreshAction={refreshDinnerVerification} issueAction={setDinnerIssued} />
  </div>;
}
