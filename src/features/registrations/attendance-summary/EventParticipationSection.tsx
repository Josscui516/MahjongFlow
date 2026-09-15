import { ParticipationSummary } from "./ParticipationSummary";
import { participationSummaryService } from "./service";

export async function EventParticipationSection({ eventId }: Readonly<{ eventId: string }>) {
  return <ParticipationSummary result={await participationSummaryService.get(eventId)} />;
}
