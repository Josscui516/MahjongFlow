import type {
  RelatedTasksResult,
  SourceNavigationReader,
  SourceTraceabilityResult,
} from "./contracts";

export const FIXTURE_MEETING_ID = "00000000-0000-4000-8000-000000000001";
export const FIXTURE_TASK_ID = "00000000-0000-4000-8000-000000000101";
export const FIXTURE_SOURCE_ID = "00000000-0000-4000-8000-000000000201";

export function createRelatedTasksFixture(): RelatedTasksResult {
  return {
    items: [
      {
        id: FIXTURE_TASK_ID,
        sourceKind: "decision",
        title: "Confirm the fictional venue booking",
      },
      {
        id: "00000000-0000-4000-8000-000000000102",
        sourceKind: "discussion",
        title: "Prepare the fictional equipment checklist",
      },
    ],
    ok: true,
  };
}

export function createSourceTraceabilityFixture(): SourceTraceabilityResult {
  return {
    ok: true,
    source: {
      meetingId: FIXTURE_MEETING_ID,
      meetingTitle: "Fictional event planning meeting",
      sourceContent: "Approve the fictional venue booking.",
      sourceKind: "decision",
    },
  };
}

export function createSourceNavigationFixtureReader(): SourceNavigationReader {
  return {
    async listRelatedTasks(meetingId) {
      return meetingId === FIXTURE_MEETING_ID
        ? createRelatedTasksFixture()
        : { code: "UNAVAILABLE", ok: false };
    },
    async readTaskSource(task) {
      return task.sourceMeetingId === FIXTURE_MEETING_ID &&
        task.sourceDecisionId === FIXTURE_SOURCE_ID
        ? createSourceTraceabilityFixture()
        : { code: "UNAVAILABLE", ok: false };
    },
  };
}
