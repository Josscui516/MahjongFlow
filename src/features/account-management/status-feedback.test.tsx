import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AccountActionState } from "./contracts";

const mocks = vi.hoisted(() => ({
  completed: null as string | null,
  result: { status: "idle", message: "" } as AccountActionState,
  update: vi.fn(), reducer: null as unknown,
  cleanup: undefined as undefined | (() => void),
}));
vi.mock("./actions", () => ({ setAccountActiveAction: mocks.update }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => [mocks.completed, (value: string | null) => { mocks.completed = value; }],
  useActionState: (reducer: unknown) => { mocks.reducer = reducer; return [mocks.result, () => {}, false]; },
  useEffect: (effect: () => undefined | (() => void)) => { mocks.cleanup = effect(); },
}));
import { AccountStatusForm } from "./AccountStatusForm";

const render = (isDisabled = false, isCurrentUser = false) => renderToStaticMarkup(AccountStatusForm({ accountId: "fictional-user", isDisabled, isCurrentUser }));
async function update(isActive: boolean) {
  const data = new FormData();
  data.set("isActive", String(isActive));
  const reducer = mocks.reducer as (state: AccountActionState, data: FormData) => Promise<AccountActionState>;
  mocks.result = await reducer(mocks.result, data);
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { setTimeout, clearTimeout });
  mocks.completed = null;
  mocks.result = { status: "idle", message: "" };
  mocks.update.mockReset();
});
afterEach(() => { mocks.cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test.each([
  [false, "Disabled", "Reactivate account"],
  [true, "Reactivated", "Disable account"],
] as const)("shows the completed status despite revalidated props, then enables the opposite action", async (initiallyDisabled, label, nextLabel) => {
  render(initiallyDisabled);
  mocks.update.mockResolvedValue({ status: "success", message: "Account updated." });
  await update(initiallyDisabled);
  const html = render(!initiallyDisabled);
  expect(html).toContain(label);
  expect(html).toContain("✓");
  expect(html).toContain('disabled=""');
  await update(!initiallyDisabled);
  expect(mocks.update).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(4999);
  expect(mocks.completed).toBe(label);
  vi.advanceTimersByTime(1);
  expect(mocks.completed).toBeNull();
  expect(render(!initiallyDisabled)).toContain(nextLabel);
  expect(render(!initiallyDisabled)).not.toContain('disabled=""');
});

test("keeps a failed mutation available for retry and displays its error", async () => {
  render();
  mocks.update.mockResolvedValue({ status: "error", message: "Unable to disable account." });
  await update(false);
  expect(mocks.completed).toBeNull();
  expect(render()).toContain('role="alert"');
  expect(render()).toContain("Disable account");
});

test("retains the self-disable restriction", async () => {
  expect(render(false, true)).toContain('disabled=""');
  await update(false);
  expect(mocks.update).not.toHaveBeenCalled();
});
