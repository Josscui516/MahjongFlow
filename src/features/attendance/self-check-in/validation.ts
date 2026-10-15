import type { SelfCheckInInput } from "./contracts";

export const CHECK_IN_REQUEST_MAX_BYTES = 1024;
const TOKEN = /^[0-9a-f]{64}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isCheckInToken(value: string): boolean {
  return TOKEN.test(value);
}

export function parseSelfCheckInInput(
  token: string,
  value: unknown,
): SelfCheckInInput | null {
  if (!isCheckInToken(token) || !value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const fullName = typeof record.fullName === "string" ? record.fullName.trim().replace(/\s+/g, " ") : "";
  if (!fullName || fullName.length > 120 || /[\u0000-\u001f\u007f]/.test(fullName)
    || record.privacyAccepted !== true) return null;
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const studentId = typeof record.studentId === "string" ? record.studentId.trim() : null;
  if (!email || email.length > 254 || !EMAIL.test(email)) return null;
  if (studentId && studentId.length > 32) return null;
  return { email, fullName, privacyAccepted: true, studentId: studentId || null, token };
}
