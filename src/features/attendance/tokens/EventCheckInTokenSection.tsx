import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";

import {
  configureCheckInWindowAction,
  revokeCheckInTokenAction,
  rotateCheckInTokenAction,
} from "./actions";
import { checkInTokenService } from "./service";
import { TokenManager } from "./TokenManager";

export async function EventCheckInTokenSection({ eventId }: Readonly<{ eventId: string }>) {
  const result = await checkInTokenService.getStatus(eventId);
  if (!result.ok) return result.code === "PERMISSION_DENIED"
    ? <PermissionDeniedFeedback />
    : <SystemErrorFeedback />;
  return <TokenManager
    configureWindow={configureCheckInWindowAction.bind(null, eventId)}
    initialStatus={result.status}
    revokeToken={revokeCheckInTokenAction.bind(null, eventId)}
    rotateToken={rotateCheckInTokenAction.bind(null, eventId)}
  />;
}
