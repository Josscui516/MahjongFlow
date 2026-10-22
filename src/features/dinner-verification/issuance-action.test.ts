import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ record: vi.fn(), revalidate: vi.fn() }));
vi.mock("./issuance", () => ({ recordDinnerIssued: mocks.record }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { setDinnerIssued } from "./issuance-action";
beforeEach(() => vi.resetAllMocks());
it.each([true, false])("invalidates the event after saving checked=%s", async checked => {
  mocks.record.mockResolvedValue({ ok: true });
  expect(await setDinnerIssued("fictional-event", "fictional-person", checked, !checked)).toEqual({ ok: true });
  expect(mocks.revalidate).toHaveBeenCalledWith("/events/fictional-event");
});
it("does not invalidate or claim success when saving fails", async () => {
  mocks.record.mockResolvedValue({ ok: false, code: "REFRESH_REQUIRED" });
  await setDinnerIssued("fictional-event", "fictional-person", true, false);
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
