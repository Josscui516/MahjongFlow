import Link from "next/link";
import { requireAuthorised } from "@/lib/auth/authorization";
import { readGlobalDinnerRoster, rosterFailure } from "@/features/dinner-verification/roster";
import { DinnerRosterManager } from "@/features/dinner-verification/DinnerRosterManager";
import { DinnerFeedback } from "@/features/dinner-verification/DinnerFeedback";

export default async function DinnerRosterPage() {
  let access;
  try { access = await requireAuthorised(); }
  catch (error) { return <DinnerFeedback code={rosterFailure(error).code} />; }
  if (!access.canManageAccounts) return <DinnerFeedback code="PERMISSION_DENIED" />;
  const result = await readGlobalDinnerRoster();
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Shared dinner eligibility roster</h1>
      <p className="mt-3 text-slate-600">Standing eligibility for all events. Event check-ins and dinner issuance are managed separately.</p>
    </header>
    <Link href="/dinner-verification" className="text-sm font-semibold text-emerald-700 underline">Open event dinner distribution →</Link>
    {result.ok ? <DinnerRosterManager items={result.items} /> : <DinnerFeedback code={result.code} />}
  </div>;
}
