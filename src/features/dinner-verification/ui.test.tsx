import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DinnerVerification } from "./DinnerVerification";
import type { DinnerVerificationResult } from "./contracts";

const eventId = "36000000-0000-4000-8000-000000000001";
const result: DinnerVerificationResult = { ok: true, event: { id: eventId, name: "Fictional Dinner Event" }, readAt: "2026-09-28T05:00:00Z", eligibleCount: 1, items: [
  { participantId: "one", participantName: "Fictional Casey", participantEmail: "casey@example.test", eligibility: "Eligible" },
] };
const render = (initialResult: DinnerVerificationResult) => renderToStaticMarkup(<DinnerVerification eventId={eventId} initialResult={initialResult} />);
describe("dinner verification UI", () => {
  it("shows current-event identity, eligibility, summary and refresh guidance", () => {
    const html = render(result);
    for (const text of ["Fictional Dinner Event", "Fictional Casey", "casey@example.test", "Eligibility"]) expect(html).toContain(text);
    for (const text of ["Refresh eligibility", "Last checked", "Check attendance", "Dinner eligibility roster", "Confirmed attendance only", "Not eligible yet"]) expect(html).not.toContain(text);
    expect(html).not.toMatch(/id="dinner-search"[^>]*disabled=""/);
    expect(html).not.toContain("student_id");
    expect(html).toContain("All participants");
  });
  it("explains an empty current-event list", () => {
    const html = render({ ...result, items: [], eligibleCount: 0 });
    expect(html).toContain("No confirmed attendance for this event yet.");
    expect(html).not.toContain("Check attendance");
  });
  it("retains an issued checkbox and warning after eligibility changes", () => {
    const html=render({ ...result, eligibleCount:0, items:[{...result.items[0],eligibility:"Not Eligible Yet",issuedAt:"2026-10-18T00:00:00Z"}] });
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked=\"\"");
    expect(html).toContain('aria-label="Eligibility: 1"');
  });
  it("paginates confirmed attendees in groups of ten", () => {
    const html = render({ ...result, items: Array.from({ length: 11 }, (_, index) => ({ ...result.items[0], participantId: `fictional-${index}`, participantName: `Fictional person ${index}` })) });
    expect(html).toContain("1–10 of 11");
    expect(html).toContain("Next");
    expect(html).not.toContain("Fictional person 10");
  });
  it("shows confirmed but ineligible attendees without enabling issuance", () => {
    const html = renderToStaticMarkup(<DinnerVerification eventId={eventId} initialResult={{ ...result, items: [{ ...result.items[0], eligibility: "Not Eligible Yet" }] }} issueAction={vi.fn()} />);
    expect(html).toContain("Fictional Casey");
    expect(html).not.toContain("Not eligible yet");
    expect(html).not.toMatch(/type="checkbox"[^>]*disabled=""/);
  });
  it.each(["PERMISSION_DENIED", "UNAUTHENTICATED", "VALIDATION", "UNAVAILABLE", "SYSTEM_ERROR"] as const)("renders safe %s without identities", (code) => {
    const html = render({ ok: false, code });
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("casey@example.test");
    expect(html).not.toContain("Eligible for dinner");
  });
});
