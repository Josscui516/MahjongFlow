import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyFeedback, SystemErrorFeedback } from "../feedback";
import { LoginShell } from "./LoginShell";
import { PageFrame } from "./PageFrame";

type FictionalRequest = () => Promise<readonly string[]>;

async function renderFictionalRequest(request: FictionalRequest) {
  try {
    const records = await request();

    return renderToStaticMarkup(
      <PageFrame
        feedbackSlot={
          records.length === 0 ? (
            <EmptyFeedback title="No fictional records" />
          ) : undefined
        }
        title="Fictional records"
      >
        <p>{records.length} records loaded.</p>
      </PageFrame>,
    );
  } catch {
    return renderToStaticMarkup(
      <PageFrame
        feedbackSlot={<SystemErrorFeedback />}
        title="Fictional records"
      >
        <p>Previously available content remains in place.</p>
      </PageFrame>,
    );
  }
}

describe("shared shell composition", () => {
  it("keeps the narrow-screen page order title, feedback, action, content", () => {
    const html = renderToStaticMarkup(
      <PageFrame
        feedbackSlot={<EmptyFeedback title="No meetings" />}
        primaryAction={<Link href="/meetings/new">New meeting</Link>}
        title="Meetings"
      >
        <p>Meeting content</p>
      </PageFrame>,
    );

    const titleIndex = html.indexOf(">Meetings</h1>");
    const feedbackIndex = html.indexOf("No meetings");
    const actionIndex = html.indexOf("New meeting");
    const contentIndex = html.indexOf("Meeting content");

    expect(titleIndex).toBeGreaterThan(-1);
    expect(feedbackIndex).toBeGreaterThan(titleIndex);
    expect(actionIndex).toBeGreaterThan(feedbackIndex);
    expect(contentIndex).toBeGreaterThan(actionIndex);
    expect(html).toContain('aria-label="Meetings content"');
    expect(html).not.toMatch(/(?:class="| )(?:[a-z]+:)?order-\d/);
  });

  it("composes a safe system failure without leaving a blank page", () => {
    const html = renderToStaticMarkup(
      <PageFrame
        feedbackSlot={<SystemErrorFeedback />}
        title="Events"
      >
        <p>Existing content remains available.</p>
      </PageFrame>,
    );

    expect(html).toContain("Events");
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Existing content remains available.");
  });

  it("provides a reusable login surface without owning auth behaviour", () => {
    const html = renderToStaticMarkup(
      <LoginShell>
        <form action="/fictional-auth-endpoint">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" />
        </form>
      </LoginShell>,
    );

    expect(html).toContain("MahjongFlow");
    expect(html).toContain("Committee coordination");
    expect(html).toContain('<h1 class="');
    expect(html).toContain("Sign in");
    expect(html).toContain('action="/fictional-auth-endpoint"');
  });

  it("maps an empty request result to the shared empty state", async () => {
    const html = await renderFictionalRequest(() => Promise.resolve([]));

    expect(html).toContain("Fictional records");
    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain("No fictional records");
    expect(html).toContain("0 records loaded.");
  });

  it("maps a failed request to a safe system state", async () => {
    const rawError =
      "SQL failed for fictional-participant@example.test using secret key";
    const html = await renderFictionalRequest(() =>
      Promise.reject(new Error(rawError)),
    );

    expect(html).toContain("Fictional records");
    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Previously available content remains in place.");
    expect(html).not.toContain(rawError);
    expect(html).not.toContain("fictional-participant@example.test");
  });
});
