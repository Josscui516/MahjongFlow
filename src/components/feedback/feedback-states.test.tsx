import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthErrorFeedback, getSafeAuthErrorCopy } from "./AuthErrorFeedback";
import {
  EmptyFeedback,
  LoadingFeedback,
  PermissionDeniedFeedback,
  SuccessFeedback,
  SystemErrorFeedback,
} from "./FeedbackStates";
import { RouteErrorFeedback, RouteLoadingStatus } from "./RouteState";

describe("shared feedback states", () => {
  it("renders the shared route loading status with motion-safe progress", () => {
    const html = renderToStaticMarkup(
      <RouteLoadingStatus
        description="preparing the latest information."
        title="Loading workspace"
      />,
    );

    expect(html).toContain('data-route-loading-status="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("motion-safe:animate-ping");
  });

  it("renders a safe, responsive route recovery panel", () => {
    const html = renderToStaticMarkup(
      <RouteErrorFeedback
        actions={<button type="button">Try again</button>}
        description="The fictional workspace could not be loaded."
        title="Workspace unavailable"
      />,
    );

    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Recovery options");
    expect(html).toContain("Try again");
    expect(html).toContain("No confirmed changes were made.");
  });

  it("renders a non-blank, polite loading status", () => {
    const html = renderToStaticMarkup(
      <LoadingFeedback title="Loading meetings" />,
    );

    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading meetings");
    expect(html).toContain("The latest information is being prepared");
  });

  it("renders a clear empty state and recovery action", () => {
    const html = renderToStaticMarkup(
      <EmptyFeedback
        action={<Link href="/meetings/new">Create a meeting</Link>}
        description="No meetings have been recorded."
        title="No meetings"
      />,
    );

    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain('role="status"');
    expect(html).toContain("No meetings have been recorded.");
    expect(html).toContain('href="/meetings/new"');
  });

  it("announces success with visible text rather than colour alone", () => {
    const html = renderToStaticMarkup(
      <SuccessFeedback message="The fictional meeting was saved." />,
    );

    expect(html).toContain('data-feedback-state="success"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Changes saved");
    expect(html).toContain("The fictional meeting was saved.");
  });

  it("uses fixed safe copy for system errors", () => {
    const html = renderToStaticMarkup(
      <SystemErrorFeedback action={<button type="button">Try again</button>} />,
    );

    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).not.toContain("SQL");
    expect(html).not.toContain("participant@");
  });

  it("denies permission without rendering resource details", () => {
    const protectedDetail = "fictional-participant@example.test";
    const html = renderToStaticMarkup(
      <PermissionDeniedFeedback
        backAction={<Link href="/events">Return to events</Link>}
      />,
    );

    expect(html).toContain('data-feedback-state="permission"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("You cannot access this page");
    expect(html).toContain("Return to events");
    expect(html).not.toContain(protectedDetail);
  });

  it("provides a safe default workspace exit for denied routes", () => {
    const html = renderToStaticMarkup(<PermissionDeniedFeedback />);
    expect(html).toContain('href="/backoffice"');
    expect(html).toContain("Return to workspace");
    expect(html).toContain("aria-describedby=");
  });

  it("gives every acceptance state a distinct visible title", () => {
    const htmlByState = [
      renderToStaticMarkup(<LoadingFeedback />),
      renderToStaticMarkup(<EmptyFeedback />),
      renderToStaticMarkup(<SuccessFeedback message="Saved." />),
      renderToStaticMarkup(<SystemErrorFeedback />),
      renderToStaticMarkup(<PermissionDeniedFeedback />),
    ];
    const states = htmlByState.map(
      (html) => html.match(/data-feedback-state="([^"]+)"/)?.[1],
    );

    expect(states).toEqual([
      "loading",
      "empty",
      "success",
      "error",
      "permission",
    ]);
    expect(htmlByState[0]).toContain("Loading");
    expect(htmlByState[1]).toContain("No results");
    expect(htmlByState[2]).toContain("Changes saved");
    expect(htmlByState[3]).toContain("Something went wrong");
    expect(htmlByState[4]).toContain("You cannot access this page");
    expect(htmlByState.every((html) => /<h2[^>]*>.+<\/h2>/.test(html))).toBe(
      true,
    );
  });
});

describe("safe authentication feedback", () => {
  it("maps the frozen public codes without exporting another contract", () => {
    expect(getSafeAuthErrorCopy("AUTH_INVALID_CREDENTIALS")).toEqual({
      message: "Check your sign-in details and try again.",
      title: "Sign in failed",
    });
    expect(getSafeAuthErrorCopy("AUTH_INVALID_SESSION").title).toBe(
      "Sign in again",
    );
    expect(getSafeAuthErrorCopy("AUTH_SERVICE_UNAVAILABLE").title).toBe(
      "Sign in unavailable",
    );
  });

  it("never echoes unknown provider details", () => {
    const rawProviderDetail =
      "SQL failed for fictional-participant@example.test using secret key";
    const html = renderToStaticMarkup(
      <AuthErrorFeedback code={rawProviderDetail} />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("We could not sign you in. Try again shortly.");
    expect(html).not.toContain(rawProviderDetail);
    expect(html).not.toContain("SQL");
    expect(html).not.toContain("secret key");
  });
});
