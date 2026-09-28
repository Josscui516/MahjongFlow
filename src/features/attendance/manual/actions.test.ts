import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ submit: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("./service", () => ({ manualAttendanceService: { submit: mocks.submit } }));

import { submitManualAttendance } from "./actions";
import type { ManualAttendanceState } from "./contracts";

const EVENT_ID = "33000000-0000-4000-8000-000000000001";
const SUCCESS: ManualAttendanceState = { status: "success", eventId: EVENT_ID, updatedAt: "2026-09-28T04:12:35.987654+00:00" };

describe("manual attendance server action", () => {
  beforeEach(() => vi.resetAllMocks());

  it("ignores untrusted previous state and always submits the bound event and fresh form", async () => {
    const form = new FormData();
    form.set("eventId", "forged-event");
    const previous: ManualAttendanceState = { status: "success", eventId: "forged-previous-event", updatedAt: "forged-time" };
    mocks.submit.mockResolvedValue({ status: "permission-denied" });
    await expect(submitManualAttendance(EVENT_ID, previous, form)).resolves.toEqual({ status: "permission-denied" });
    expect(mocks.submit).toHaveBeenCalledExactlyOnceWith(EVENT_ID, form);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates the authorised attendance and safe event views after success", async () => {
    mocks.submit.mockResolvedValue(SUCCESS);
    await expect(submitManualAttendance(EVENT_ID, { status: "idle" }, new FormData())).resolves.toEqual(SUCCESS);
    expect(mocks.revalidatePath.mock.calls).toEqual([[`/attendance/${EVENT_ID}`], [`/events/${EVENT_ID}`]]);
  });

  it.each(["unauthenticated", "permission-denied", "unavailable", "duplicate", "conflict", "system-error"] as const)(
    "does not revalidate after %s", async (status) => {
      mocks.submit.mockResolvedValue({ status });
      await expect(submitManualAttendance(EVENT_ID, SUCCESS, new FormData())).resolves.toEqual({ status });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("returns server validation unchanged, with no cache mutation", async () => {
    const validation: ManualAttendanceState = { status: "validation", errors: [{ field: "confirmation", message: "Confirm the change." }] };
    mocks.submit.mockResolvedValue(validation);
    await expect(submitManualAttendance(EVENT_ID, SUCCESS, new FormData())).resolves.toEqual(validation);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([1, 2])("still reports committed success if cache invalidation %i fails", async (failureIndex) => {
    mocks.submit.mockResolvedValue(SUCCESS);
    let call = 0;
    mocks.revalidatePath.mockImplementation(() => {
      call += 1;
      if (call === failureIndex) throw new Error("private cache detail");
    });
    await expect(submitManualAttendance(EVENT_ID, { status: "idle" }, new FormData())).resolves.toEqual({ ...SUCCESS, refreshRequired: true });
    expect(mocks.submit).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(failureIndex);
  });
});
