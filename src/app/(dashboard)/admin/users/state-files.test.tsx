import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import AccountManagementError from "./error";
import AccountManagementLoading from "./loading";

describe("account-management route states", () => {
  it("renders a structure-matched, accessible loading state", () => {
    const html = renderToStaticMarkup(<AccountManagementLoading />);

    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain('data-route-loading-status="true"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading committee accounts");
    expect(html).toContain("motion-safe:animate-pulse");
  });

  it("renders safe recovery actions without exposing the server error", () => {
    const privateMessage = "private provider response";
    const html = renderToStaticMarkup(
      <AccountManagementError
        error={Object.assign(new Error(privateMessage), {
          digest: "safe-digest",
        })}
        retry={vi.fn()}
      />,
    );

    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain("Account service unavailable");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/backoffice"');
    expect(html).not.toContain(privateMessage);
  });
});
