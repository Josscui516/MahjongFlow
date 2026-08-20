import { describe, expect, it, vi } from "vitest";

import { saveAgendaSafely } from "./client-submission";

describe("meeting agenda client submission boundary", () => {
  it("maps a rejected action to a safe system result", async () => {
    const draft = {
      discussionPoints: [{ content: "Fictional discussion" }],
      decisions: [{ content: "Fictional decision" }],
    };

    await expect(
      saveAgendaSafely(
        vi.fn().mockRejectedValue(new Error("private transport detail")),
        draft,
      ),
    ).resolves.toEqual({
      code: "system",
      message: "Unable to save the meeting agenda. Please try again.",
      ok: false,
    });
  });
});
