import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { BackofficeShell } from "./BackofficeShell";

const COMMITTEE_CONTEXT = {
  role: "committee",
  userId: "00000000-0000-4000-8000-000000000011",
} as const;

const AUTHORISED_CONTEXT = {
  role: "authorised",
  userId: "00000000-0000-4000-8000-000000000012",
} as const;

type TestAccessContext = typeof COMMITTEE_CONTEXT | typeof AUTHORISED_CONTEXT;

/** Models the planned one-field handoff; this is not an authorisation test. */
function renderFromTrustedTestContext(
  context: TestAccessContext,
  children: ReactNode,
  options?: Readonly<{
    accountSlot?: ReactNode;
    currentPath?: string;
  }>,
) {
  return renderToStaticMarkup(
    <BackofficeShell
      accountSlot={options?.accountSlot}
      currentPath={options?.currentPath}
      role={context.role}
      signOutSlot={<button type="button">Sign out</button>}
    >
      {children}
    </BackofficeShell>,
  );
}

describe("BackofficeShell", () => {
  it("renders landmarks and committee UI through a role-only adapter", () => {
    const html = renderFromTrustedTestContext(
      COMMITTEE_CONTEXT,
      <h1>Dashboard</h1>,
      {
        accountSlot: <span>Fictional committee member</span>,
        currentPath: "/dashboard",
      },
    );

    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
    expect(html).toContain("<header");
    expect(html).toContain('<main class="');
    expect(html).toContain('id="main-content"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("Role: Committee");
    expect(html).toContain("Fictional committee member");
    expect(html).toContain("Sign out");
    expect(html).toContain("<h1>Dashboard</h1>");
    expect(html).not.toContain(COMMITTEE_CONTEXT.userId);
    expect(html).not.toContain("Registrations");
  });

  it("passes only the authorised role without exposing unfinished modules", () => {
    const html = renderFromTrustedTestContext(
      AUTHORISED_CONTEXT,
      <p>Protected fictional content</p>,
    );

    expect(html).toContain("Role: Authorised");
    expect(html).not.toContain("Sensitive operations");
    expect(html).not.toContain("Registrations");
    expect(html).toContain("Protected fictional content");
    expect(html).not.toContain(AUTHORISED_CONTEXT.userId);
  });
});
