import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RelatedTasksPanel, RelatedTasksPanelLoading } from "./RelatedTasksPanel";
import {
  createRelatedTasksFixture,
  createSourceNavigationFixtureReader,
  createSourceTraceabilityFixture,
  FIXTURE_MEETING_ID,
  FIXTURE_SOURCE_ID,
  FIXTURE_TASK_ID,
} from "./source-navigation.fixture";
import {
  SourceTraceabilityPanel,
  SourceTraceabilityPanelLoading,
} from "./SourceTraceabilityPanel";

describe("RelatedTasksPanel", () => {
  it.each([false, true])("uses the current agenda order for source numbers (reversed: %s)", (reversed) => {
    const agendaItems = [
      { id: "discussion-source", kind: "discussion" as const },
      { id: FIXTURE_SOURCE_ID, kind: "decision" as const },
    ];
    if (reversed) agendaItems.reverse();
    const html = renderToStaticMarkup(<RelatedTasksPanel agendaItems={agendaItems} result={{ok: true, items: [{id: FIXTURE_TASK_ID, title: "Fictional full task title", sourceKind: "decision", sourceId: FIXTURE_SOURCE_ID, status: "not_started"}]}} />);
    expect(html).toContain(`Agenda item ${reversed ? 1 : 2}`);
    expect(html).toContain("Fictional full task title");
    expect(html).toContain("Not started");
    expect(html).toContain(`href="/tasks/${FIXTURE_TASK_ID}"`);
  });

  it("does not invent an agenda number for an unmatched source", () => {
    const html = renderToStaticMarkup(<RelatedTasksPanel agendaItems={[{id: FIXTURE_SOURCE_ID, kind: "discussion"}]} result={{ok: true, items: [{id: FIXTURE_TASK_ID, title: "Fictional task", sourceKind: "decision", sourceId: FIXTURE_SOURCE_ID}]}} />);
    expect(html).toContain("Meeting agenda source");
    expect(html).not.toContain("Agenda item 1");
  });
  it("displays manually associated tasks without claiming a decision or discussion source", () => {
    const html = renderToStaticMarkup(<RelatedTasksPanel result={{ ok: true, items: [{ id: FIXTURE_TASK_ID, title: "Fictional linked follow-up", sourceKind: null }] }} />);
    expect(html).toContain("Linked meeting");
    expect(html).toContain("linked to this meeting");
    expect(html).not.toContain("Meeting agenda source");
  });
  it("renders decision and discussion tasks with descriptive links", () => {
    const html = renderToStaticMarkup(
      <RelatedTasksPanel result={createRelatedTasksFixture()} />,
    );

    expect(html).toContain('data-source-navigation-state="success"');
    expect(html).toContain("Meeting agenda source");
    expect(html).toContain("Meeting agenda source");
    expect(html).toContain('href="/tasks/00000000-0000-4000-8000-000000000101"');
    expect(html).toContain("Open task Confirm the fictional venue booking from this meeting agenda");
  });

  it("renders an explicit empty state", () => {
    const html = renderToStaticMarkup(
      <RelatedTasksPanel result={{ items: [], ok: true }} />,
    );

    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain("No related tasks yet");
  });

  it("does not distinguish missing and forbidden resources in its unavailable state", () => {
    const html = renderToStaticMarkup(
      <RelatedTasksPanel result={{ code: "UNAVAILABLE", ok: false }} />,
    );

    expect(html).toContain('data-source-navigation-state="unavailable"');
    expect(html).toContain("Source information unavailable");
    expect(html).not.toContain("permission");
    expect(html).not.toContain("missing");
    expect(html).not.toContain("href=");
  });

  it("uses fixed system-error and loading feedback", () => {
    const errorHtml = renderToStaticMarkup(
      <RelatedTasksPanel result={{ code: "SYSTEM_ERROR", ok: false }} />,
    );
    const loadingHtml = renderToStaticMarkup(<RelatedTasksPanelLoading />);

    expect(errorHtml).toContain('data-feedback-state="error"');
    expect(errorHtml).toContain("Something went wrong");
    expect(loadingHtml).toContain('data-feedback-state="loading"');
    expect(loadingHtml).toContain("Loading related tasks");
  });
});

describe("SourceTraceabilityPanel", () => {
  it("shows safe source context and links back to its meeting", () => {
    const html = renderToStaticMarkup(
      <SourceTraceabilityPanel result={createSourceTraceabilityFixture()} />,
    );

    expect(html).toContain("Meeting agenda source");
    expect(html).toContain("Fictional event planning meeting");
    expect(html).toContain("Approve the fictional venue booking.");
    expect(html).toContain('href="/meetings/00000000-0000-4000-8000-000000000001"');
    expect(html).toContain("Return to source meeting Fictional event planning meeting");
  });

  it("renders no-source, unavailable, system-error, and loading states", () => {
    const emptyHtml = renderToStaticMarkup(
      <SourceTraceabilityPanel result={{ ok: true, source: null }} />,
    );
    const unavailableHtml = renderToStaticMarkup(
      <SourceTraceabilityPanel result={{ code: "UNAVAILABLE", ok: false }} />,
    );
    const errorHtml = renderToStaticMarkup(
      <SourceTraceabilityPanel result={{ code: "SYSTEM_ERROR", ok: false }} />,
    );
    const loadingHtml = renderToStaticMarkup(<SourceTraceabilityPanelLoading />);

    expect(emptyHtml).toContain("No meeting source");
    expect(unavailableHtml).toContain("Source information unavailable");
    expect(unavailableHtml).not.toContain("href=");
    expect(errorHtml).toContain("Something went wrong");
    expect(loadingHtml).toContain("Loading source details");
  });

  it("encodes route identifiers before rendering links", () => {
    const sourceResult = createSourceTraceabilityFixture();
    if (!sourceResult.ok || !sourceResult.source) throw new Error("Fixture must contain a source");

    const html = renderToStaticMarkup(
      <SourceTraceabilityPanel
        result={{
          ok: true,
          source: { ...sourceResult.source, meetingId: "meeting/fictional context" },
        }}
      />,
    );

    expect(html).toContain('href="/meetings/meeting%2Ffictional%20context"');
  });
});

describe("source navigation fixture adapter", () => {
  it("supports independent development without guessing provider internals", async () => {
    const reader = createSourceNavigationFixtureReader();

    await expect(reader.listRelatedTasks(FIXTURE_MEETING_ID)).resolves.toMatchObject({
      ok: true,
    });
    await expect(
      reader.readTaskSource({
        sourceDecisionId: FIXTURE_SOURCE_ID,
        sourceMeetingId: FIXTURE_MEETING_ID,
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(reader.readTaskSource({})).resolves.toEqual({
      code: "UNAVAILABLE",
      ok: false,
    });
  });
});
