import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { RegistrationList } from "../records/RegistrationList";
import { validCreateInput } from "../records/validation";
const eventId = "28000000-0000-4000-8000-000000000021";
it.each([null, "2026-09-10T01:00:00Z"])("keeps privacy metadata out of the simplified roster for acknowledgement %s", timestamp => {
  const html = renderToStaticMarkup(<RegistrationList result={{ ok: true, eventId, page: 1, total: 1, items: [{ id: eventId, participantName: "Fictional Person", participantEmail: "person@example.test", status: "registered", updatedAt: "2026-09-10T01:00:00Z", privacyNoticeAcknowledgedAt: timestamp }] }} />);
  expect(html).toContain("Fictional Person"); expect(html).toContain("person@example.test");
  expect(html).not.toContain("Privacy acknowledgement"); expect(html).not.toContain("2026-09-10T01:00:00Z");
});
it("rejects browser attempts to enable self-service or fabricate acknowledgement", () => { const input = { eventId, participantId: eventId }; expect(validCreateInput(input)).toBe(true); expect(validCreateInput({ ...input, selfService: true })).toBe(false); expect(validCreateInput({ ...input, privacyNoticeAcknowledgedAt: "2026-09-10T01:00:00Z" })).toBe(false); });
