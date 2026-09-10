import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { RegistrationList } from "../records/RegistrationList";
import { validCreateInput } from "../records/validation";
const eventId = "28000000-0000-4000-8000-000000000021";
it.each([null, "2026-09-10T01:00:00Z"])("displays authorised privacy acknowledgement %s independently of registration status", timestamp => {
  const html = renderToStaticMarkup(<RegistrationList changeStatus={vi.fn()} result={{ ok: true, eventId, page: 1, total: 1, items: [{ id: eventId, participantName: "Fictional Person", participantEmail: "person@example.test", status: "registered", updatedAt: "2026-09-10T01:00:00Z", privacyNoticeAcknowledgedAt: timestamp }] }} />);
  expect(html).toContain("Registered"); expect(html).not.toContain("Attended");
  expect(html).toContain(timestamp ? 'dateTime="2026-09-10T01:00:00Z"' : "Not recorded (permitted for back-office entry)");
});
it("rejects browser attempts to enable self-service or fabricate acknowledgement", () => { const input = { eventId, participantId: eventId }; expect(validCreateInput(input)).toBe(true); expect(validCreateInput({ ...input, selfService: true })).toBe(false); expect(validCreateInput({ ...input, privacyNoticeAcknowledgedAt: "2026-09-10T01:00:00Z" })).toBe(false); });
