import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { RegistrationList } from "./RegistrationList";
import { RegistrationCount } from "./RegistrationCount";
import { RegistrationCreateForm } from "./RegistrationForms";
import { registrationMessage } from "./messages";
const eventId = "27000000-0000-4000-8000-000000000001";
const changeStatus = vi.fn();
describe("registration UI projections", () => {
  it("renders independent registered/cancelled labels and the appropriate action", () => {
    const html = renderToStaticMarkup(<RegistrationList changeStatus={changeStatus} result={{ ok: true, eventId, page: 1, total: 30, items: [
      { id: "1", participantName: "Fictional One", participantEmail: "one@example.test", status: "registered", updatedAt: "2026-09-08T00:00:00Z" },
      { id: "2", participantName: "Fictional Two", participantEmail: "two@example.test", status: "cancelled", updatedAt: "2026-09-08T00:00:00Z" },
    ] }} />);
    expect(html).toContain("Registered"); expect(html).toContain("Cancelled");
    expect(html).toContain("Cancel registration"); expect(html).toContain("Restore registration");
    expect(html).toContain("Next page"); expect(html).not.toContain("Previous page");
  });
  it("renders empty and denied states without sensitive fields", () => {
    expect(renderToStaticMarkup(<RegistrationList changeStatus={changeStatus} result={{ ok: true, eventId, page: 1, total: 0, items: [] }} />)).toContain("No registrations");
    const denied = renderToStaticMarkup(<RegistrationList changeStatus={changeStatus} result={{ ok: false, code: "PERMISSION_DENIED" }} />);
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
