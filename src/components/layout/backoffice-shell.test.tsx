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
    displayName?: string;
    currentPath?: string;
  }>,
) {
  return renderToStaticMarkup(
    <BackofficeShell
      displayName={options?.displayName}
      currentPath={options?.currentPath}
      role={context.role}
      signOutSlot={<button type="button">Sign out</button>}
    >
      {children}
    </BackofficeShell>,
  );
}

describe("BackofficeShell", () => {
  it.each(["/dashboard", "/meetings/new", "/meetings/fictional-meeting", "/tasks/fictional-task/edit", "/events/fictional-event", "/registrations/fictional-event", "/attendance/fictional-event", "/dinner-verification/fictional-event", "/admin/users"])("uses the same account identity on %s", (currentPath) => {
    const html = renderFromTrustedTestContext(COMMITTEE_CONTEXT, <p>Content</p>, {
      currentPath,
      displayName: "  Alex Example  ",
    });
    expect(html).toContain('Signed in as <strong class="font-semibold text-slate-900">Alex Example</strong>');
    expect(html).toContain("Role: Committee");
    expect(html).toContain("Sign out");
  });

  it("uses the Dashboard fallback when a display name is blank", () => {
    const html = renderFromTrustedTestContext(AUTHORISED_CONTEXT, <p>Content</p>, { displayName: "  " });
    expect(html).toContain('Signed in as <strong class="font-semibold text-slate-900">Committee member</strong>');
  });

  it("renders landmarks and committee UI through a role-only adapter", () => {
    const html = renderFromTrustedTestContext(
      COMMITTEE_CONTEXT,
      <h1>Dashboard</h1>,
      {
        displayName: "Fictional committee member",
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
    expect(html).not.toContain("Dinner eligibility roster");
  });

  it("preserves authorised content while hiding secondary navigation", () => {
    const html = renderFromTrustedTestContext(
      AUTHORISED_CONTEXT,
      <p>Protected fictional content</p>,
    );

    expect(html).toContain("Role: Authorised");
    expect(html).not.toContain("Sensitive operations");
    expect(html).not.toContain("Registrations");
    expect(html).not.toContain("Dinner eligibility roster");
    expect(html).toContain("Protected fictional content");
    expect(html).not.toContain(AUTHORISED_CONTEXT.userId);
  });
});
