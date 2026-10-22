import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { TokenManager } from "./TokenManager";

it("renders an authorised, accessible token manager without secret database fields", () => {
  const html = renderToStaticMarkup(<TokenManager eventStartsAt="2026-10-21T08:00:00Z"
    configureWindow={vi.fn()}
    initialStatus={{
      active: true,
      closesAt: "2026-09-16T11:00:00.000Z",
      createdAt: "2026-09-16T06:00:00.000Z",
      opensAt: "2026-09-16T08:00:00.000Z",
      revokedAt: null,
    }}
    revokeToken={vi.fn()}
    rotateToken={vi.fn()}
  />);
  expect(html).toContain("QR registration");
  expect(html).not.toContain("QR registration and check-in");
  expect(html).toContain("Registration window:");
  expect(html).toContain("Edit times");
  expect(html).toContain("Generate replacement link");
  expect(html).toContain("Revoke active link");
  expect(html).not.toContain("token_digest");
  expect(html).not.toContain("created_by");
  expect(html).not.toContain("participant_id");
  expect(html).not.toContain("participant_email");
});

it("guides initial setup and hides revocation until an active link exists", () => {
  const html = renderToStaticMarkup(<TokenManager eventStartsAt="2026-10-21T08:00:00Z" configureWindow={vi.fn()} revokeToken={vi.fn()} rotateToken={vi.fn()} initialStatus={{ active: false, opensAt: null, closesAt: null, createdAt: null, revokedAt: null }} />);
  expect(html).not.toContain('aria-label="QR setup steps"');
  expect(html).not.toContain("Set opening and closing times");
  expect(html).toContain("Registration link:");
  expect(html).toContain("Not generated");
  expect(html).toContain('value="2026-10-21T19:00"');
  expect(html).toContain('value="2026-10-21T21:00"');
  expect(html).toContain('aria-describedby="qr-window-hint" disabled=""');
  expect(html).toContain("Set and save the opening and closing times");
  expect(html).not.toContain("Revoke active link");
});
it("enables generation for a saved window and describes a revoked link accurately", () => {
  const html = renderToStaticMarkup(<TokenManager eventStartsAt="2026-10-21T08:00:00Z" configureWindow={vi.fn()} revokeToken={vi.fn()} rotateToken={vi.fn()} initialStatus={{ active: false, opensAt: "2026-10-21T06:00:00Z", closesAt: "2026-10-21T12:00:00Z", createdAt: null, revokedAt: "2026-10-21T07:00:00Z" }} />);
  expect(html).toContain("Revoked");
  expect(html).not.toContain('id="qr-window-hint"');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*type="submit">Save window<\/button>/);
  expect(html).toMatch(/<button(?![^>]*disabled=)[^>]*>Generate QR link<\/button>/);
  expect(html).not.toContain("Revoke active link");
});
