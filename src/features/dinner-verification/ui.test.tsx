import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DinnerVerification } from "./DinnerVerification";
import type { DinnerVerificationResult } from "./contracts";

const eventId = "36000000-0000-4000-8000-000000000001";
const result: DinnerVerificationResult = { ok: true, event: { id: eventId, name: "Fictional Dinner Event" }, readAt: "2026-09-28T05:00:00Z", eligibleCount: 1, items: [
  { participantId: "one", participantName: "Fictional Casey", participantEmail: "casey@example.test", eligibility: "Eligible" },
] };
const render = (initialResult: DinnerVerificationResult) => renderToStaticMarkup(<DinnerVerification eventId={eventId} initialResult={initialResult} refreshAction={vi.fn()} />);
describe("dinner verification UI", () => {
  it("shows current-event identity, eligibility, summary and refresh guidance", () => {
    const html = render(result);
    for (const text of ["Fictional Dinner Event", "Fictional Casey", "casey@example.test", "matched attendees", "Refresh eligibility", "Refresh after any check-in, registration or shared roster change", "Sydney"]) expect(html).toContain(text);
    expect(html).not.toContain("student_id");
    expect(html).not.toContain("<select");
  });
  it("explains an empty current-event list", () => {
    expect(render({ ...result, items: [], eligibleCount: 0 })).toContain("No confirmed check-ins match the shared dinner eligibility roster");
  });
  it("retains an issued checkbox and warning after eligibility changes", () => {
    const html=render({ ...result, eligibleCount:0, items:[{...result.items[0],eligibility:"Not Eligible Yet",issuedAt:"2026-10-18T00:00:00Z"}] });
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked=\"\"");
    expect(html).toContain("Eligibility changed after serving");
    expect(html).toContain("1 issued");
  });
  it.each(["PERMISSION_DENIED", "UNAUTHENTICATED", "VALIDATION", "UNAVAILABLE", "SYSTEM_ERROR"] as const)("renders safe %s without identities", (code) => {
    const html = render({ ok: false, code });
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("casey@example.test");
    expect(html).not.toContain("Eligible for dinner");
  });
});
