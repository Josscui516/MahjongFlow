import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { RegistrationList } from "./RegistrationList";
import { RegistrationCount } from "./RegistrationCount";
import { RegistrationCreateForm } from "./RegistrationForms";
import { registrationMessage } from "./messages";
const eventId = "27000000-0000-4000-8000-000000000001";
describe("registration UI projections", () => {
  it("renders names and emails without status actions or privacy metadata", () => {
    const html = renderToStaticMarkup(<RegistrationList result={{ ok: true, eventId, page: 1, total: 30, items: [
      { id: "1", privacyNoticeAcknowledgedAt: null, participantName: "Fictional One", participantEmail: "one@example.test", status: "registered", updatedAt: "2026-09-08T00:00:00Z" },
      { id: "2", privacyNoticeAcknowledgedAt: null, participantName: "Fictional Two", participantEmail: "two@example.test", status: "cancelled", updatedAt: "2026-09-08T00:00:00Z" },
    ] }} />);
    expect(html).toContain("Fictional One"); expect(html).toContain("two@example.test");
    expect(html).not.toContain("Cancel registration"); expect(html).not.toContain("Restore registration"); expect(html).not.toContain("Privacy acknowledgement");
    expect(html).toContain("Next page"); expect(html).toContain("Previous page"); expect(html).toContain("disabled");
  });
  it.each([0, 34, null])("renders the independently sourced count %s without key warnings", registrationCount => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(<RegistrationList registrationCount={registrationCount} result={{ ok: true, eventId, page: 1, total: 1, items: [] }} />);
      if (registrationCount === null) {
        expect(html).toContain("Count unavailable");
        expect(html).not.toContain('data-testid="registered-count"');
      } else {
        expect(html).toContain(`aria-label="${registrationCount} currently registered"`);
      }
      expect(consoleError).not.toHaveBeenCalled();
    } finally { consoleError.mockRestore(); }
  });
  it("renders empty and denied states without sensitive fields", () => {
    expect(renderToStaticMarkup(<RegistrationList result={{ ok: true, eventId, page: 1, total: 0, items: [] }} />)).toContain("No registrations");
    const denied = renderToStaticMarkup(<RegistrationList result={{ ok: false, code: "PERMISSION_DENIED" }} />);
    expect(denied).toContain('role="alert"'); expect(denied).not.toContain("@example.test");
  });
  it("does not misrepresent a count failure as zero", () => {
    expect(renderToStaticMarkup(<RegistrationCount result={{ ok: false, code: "SYSTEM_ERROR" }} />)).toContain("unavailable");
    expect(renderToStaticMarkup(<RegistrationCount result={{ ok: true, eventId, registrationCount: 0 }} />)).toContain("<strong>0</strong>");
  });
  it("consumes a resolved participant without duplicating identity fields", () => {
    const html = renderToStaticMarkup(<RegistrationCreateForm eventId={eventId} participant={{ id: "fixture", label: "Fictional Name" }} register={vi.fn()} />);
    expect(html).toContain("Register Fictional Name"); expect(html).toContain("Register participant"); expect(html).not.toContain("<input");
  });
  it("explains a cancelled duplicate and cache-refresh failure", () => {
    expect(registrationMessage({ ok: true, eventId, outcome: "duplicate", status: "cancelled" })).toContain("Restore it");
    expect(registrationMessage({ ok: true, eventId, outcome: "created", status: "registered", refreshRequired: true })).toContain("Refresh the page");
  });
});
