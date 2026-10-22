import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AccountActionState } from "./contracts";

const mocks = vi.hoisted(() => ({
  sent: false, result: { status: "idle", message: "" } as AccountActionState,
  send: vi.fn(), reducer: null as unknown, cleanup: undefined as undefined | (() => void),
}));
vi.mock("./actions", () => ({ sendRecoveryAction: mocks.send }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => [mocks.sent, (value: boolean) => { mocks.sent = value; }],
  useActionState: (reducer: unknown) => { mocks.reducer = reducer; return [mocks.result, () => {}, false]; },
  useEffect: (effect: () => undefined | (() => void)) => { mocks.cleanup = effect(); },
}));
import { RecoveryEmailForm } from "./RecoveryEmailForm";

const render = (disabled = false) => renderToStaticMarkup(RecoveryEmailForm({ accountId: "fictional-user", disabled }));
async function send() {
  const reducer = mocks.reducer as (state: AccountActionState, data: FormData) => Promise<AccountActionState>;
  mocks.result = await reducer(mocks.result, new FormData());
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { setTimeout, clearTimeout });
  mocks.sent = false;
  mocks.result = { status: "idle", message: "" };
  mocks.send.mockReset();
});
afterEach(() => { mocks.cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("shows Sent, blocks resends for five seconds, then restores the button", async () => {
  render();
  mocks.send.mockResolvedValue({ status: "success", message: "Password recovery email sent." });
  await send();
  const html = render();
  expect(html).toContain("Sent");
  expect(html).toContain("✓");
  expect(html).toContain('disabled=""');
  expect(html).not.toContain('role="alert"');
  await send();
  expect(mocks.send).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(4999);
  expect(mocks.sent).toBe(true);
  vi.advanceTimersByTime(1);
  expect(mocks.sent).toBe(false);
  expect(render()).toContain("Send password recovery");
  expect(render()).not.toContain('disabled=""');
});

test("keeps errors visible without starting the cooldown", async () => {
  render();
  mocks.send.mockResolvedValue({ status: "error", message: "Unable to send." });
  await send();
  expect(render()).toContain('role="alert"');
  expect(mocks.sent).toBe(false);
});

test("disabled accounts cannot send recovery emails", async () => {
  expect(render(true)).toContain('disabled=""');
  await send();
  expect(mocks.send).not.toHaveBeenCalled();
});
