import { ParticipationSummary } from "./ParticipationSummary";
import { participationSummaryService } from "./service";
import { readDinnerEligibilityCount } from "@/features/dinner-verification/server";

export async function EventParticipationSection({ eventId }: Readonly<{ eventId: string }>) {
  const [result, dinnerEligibilityCount] = await Promise.all([
    participationSummaryService.get(eventId),
    readDinnerEligibilityCount(eventId),
  ]);
  return <ParticipationSummary compact showExplanation={false} title="Participation overview" result={result} dinnerEligibilityCount={dinnerEligibilityCount} />;
}
