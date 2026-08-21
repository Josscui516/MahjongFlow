import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import BackofficeError from "./backoffice/error";
import BackofficeLoading from "./backoffice/loading";
import AccountPasswordError from "./account/password/error";
import AccountPasswordLoading from "./account/password/loading";
import LoginError from "./login/error";
import LoginLoading from "./login/loading";
import RegistrationsError from "./registrations/error";
import RegistrationsLoading from "./registrations/loading";

describe("authentication and access route states", () => {
  it.each([
    ["login", <LoginLoading key="login" />, "Preparing sign in"],
    ["back office", <BackofficeLoading key="backoffice" />, "Preparing the back office"],
    ["registrations", <RegistrationsLoading key="registrations" />, "Preparing registrations"],
    ["password setup", <AccountPasswordLoading key="password" />, "Preparing password setup"],
  ])("renders the %s loading state with the shared secure shell", (_, view, copy) => {
    const html = renderToStaticMarkup(view);

    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain('data-route-loading-status="true"');
    expect(html).toContain("MahjongFlow");
    expect(html).toContain(copy);
  });

  it.each([
    ["login", LoginError, "Sign in is temporarily unavailable"],
    ["back office", BackofficeError, "Back office unavailable"],
    ["registrations", RegistrationsError, "Registrations unavailable"],
    ["password setup", AccountPasswordError, "Password setup unavailable"],
  ])("renders a safe %s route error", (_, ErrorView, copy) => {
    const privateMessage = "private provider response";
    const html = renderToStaticMarkup(
      <ErrorView
        error={Object.assign(new Error(privateMessage), {
          digest: "safe-digest",
        })}
        retry={vi.fn()}
      />,
    );

    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain("Recovery options");
    expect(html).toContain(copy);
    expect(html).toContain("Try again");
    expect(html).not.toContain(privateMessage);
  });
});
