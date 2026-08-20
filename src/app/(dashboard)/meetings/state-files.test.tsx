import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import MeetingHistoryError from "./error";
import MeetingHistoryLoading from "./loading";

describe("meeting history route states", () => {
  it("renders an accessible loading state", () => {
    const html = renderToStaticMarkup(<MeetingHistoryLoading />);

    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading meeting history");
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
    expect(html).toContain("Try again");
    expect(html).not.toContain(error.message);
  });
});
