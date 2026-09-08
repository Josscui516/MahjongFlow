import type { RegistrationFailureCode, RegistrationMutationResult } from "./contracts";
export const registrationErrors: Record<RegistrationFailureCode, string> = {
  UNAUTHENTICATED: "Please sign in to manage registrations.",
  PERMISSION_DENIED: "You do not have permission to view or change registrations.",
  VALIDATION: "Check the event and participant selection. Required participant details may be incomplete.",
  UNAVAILABLE: "These registration details are unavailable.",
  CONFLICT: "This registration changed since you opened it. Refresh before trying again.",
  SYSTEM_ERROR: "Registrations could not be processed. Please try again.",
};
export function registrationMessage(result: RegistrationMutationResult): string {
  if (!result.ok) return registrationErrors[result.code];
  if (result.refreshRequired) return "Registration saved. Refresh the page to see the latest records and counts.";
  if (result.outcome === "duplicate") return result.status === "cancelled"
    ? "This participant already has a cancelled registration. Restore it from the list if needed."
    : "This participant is already registered. No duplicate was created.";
  if (result.outcome === "unchanged") return `Registration is already ${result.status}.`;
  return result.status === "cancelled" ? "Registration cancelled." : "Participant registered.";
}
