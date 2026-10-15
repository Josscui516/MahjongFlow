import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { TokenManager } from "./TokenManager";

it("renders an authorised, accessible token manager without secret database fields", () => {
  const html = renderToStaticMarkup(<TokenManager
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
  expect(html).toContain("QR registration entry");
  expect(html).toContain("Opens (Sydney time)");
  expect(html).toContain("Rotate QR link");
  expect(html).toContain("Revoke active link");
  expect(html).not.toContain("token_digest");
  expect(html).not.toContain("created_by");
  expect(html).not.toContain("participant");
});
