import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import MeetingHistoryError from "./(history)/error";
import MeetingHistoryLoading from "./(history)/loading";
import MeetingDetailError from "./[meetingId]/error";
import MeetingDetailLoading from "./[meetingId]/loading";
import MeetingNotFound from "./[meetingId]/not-found";
import NewMeetingError from "./new/error";
import NewMeetingLoading from "./new/loading";

describe("meeting history route states", () => {
  it("renders an accessible loading state", () => {
    const html = renderToStaticMarkup(<MeetingHistoryLoading />);

    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain('data-loading-pattern="meeting-timeline"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading meetings");
    expect(html).toContain("motion-safe:animate-pulse");
  });

  it("renders a retry action without exposing the server error", () => {
    const retry = vi.fn();
    const error = Object.assign(new Error("private provider response"), {
      digest: "safe-digest",
    });
    const html = renderToStaticMarkup(
      <MeetingHistoryError error={error} retry={retry} />,
    );

    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain('data-error-pattern="interrupted-timeline"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Try again");
    expect(html).toContain('href="/backoffice"');
    expect(html).toContain("Meeting records could not be loaded");
    expect(html).not.toContain(error.message);
  });
});

describe("meeting editor route states", () => {
  it.each([
    [
      "detail",
      <MeetingDetailLoading key="detail-loading" />,
      "Loading meeting details",
    ],
    [
      "create",
      <NewMeetingLoading key="create-loading" />,
      "Preparing the meeting editor",
    ],
  ])("renders the %s loading state as the future page structure", (_, view, copy) => {
    const html = renderToStaticMarkup(view);

    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain('data-meeting-loading-status="true"');
    expect(html).toContain(copy);
    expect(html).toContain("motion-safe:animate-pulse");
    expect(html).not.toContain('data-meeting-state="loading"');
  });

  it.each([
    ["detail", MeetingDetailError, "Meeting details are unavailable"],
    ["create", NewMeetingError, "The meeting editor is unavailable"],
  ])("renders a safe %s route error with recovery actions", (_, ErrorView, copy) => {
    const privateMessage = "private provider response";
    const html = renderToStaticMarkup(
      <ErrorView
        error={Object.assign(new Error(privateMessage), {
          digest: "safe-digest",
        })}
        retry={vi.fn()}
      />,
    );

    expect(html).toContain('data-meeting-route-state="system"');
    expect(html).toContain(copy);
    expect(html).toContain("Try again");
    expect(html).toContain('href="/meetings"');
    expect(html).not.toContain(privateMessage);
  });

  it("renders a distinct missing-meeting recovery state", () => {
    const html = renderToStaticMarkup(<MeetingNotFound />);

    expect(html).toContain('data-meeting-route-state="not-found"');
    expect(html).toContain("Meeting not found");
    expect(html).toContain('href="/meetings"');
  });
});
