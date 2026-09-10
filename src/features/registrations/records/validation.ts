import type { RegistrationCreateInput, RegistrationUpdateInput } from "./contracts";

export const isRegistrationId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function exactObject(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === fields.length
    && fields.every((field) => Object.hasOwn(value, field));
}

export function validCreateInput(value: unknown): value is RegistrationCreateInput {
  return exactObject(value, ["eventId", "participantId"])
    && isRegistrationId(value.eventId) && isRegistrationId(value.participantId);
}

export function validUpdateInput(value: unknown): value is RegistrationUpdateInput {
  return exactObject(value, ["eventId", "registrationId", "status", "expectedUpdatedAt"])
    && isRegistrationId(value.eventId) && isRegistrationId(value.registrationId)
    && (value.status === "registered" || value.status === "cancelled")
    && typeof value.expectedUpdatedAt === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value.expectedUpdatedAt)
    && Number.isFinite(Date.parse(value.expectedUpdatedAt));
}

export function validRegistrationPage(page: unknown): page is number {
  return typeof page === "number" && Number.isSafeInteger(page) && page >= 1 && page <= 10000;
}
