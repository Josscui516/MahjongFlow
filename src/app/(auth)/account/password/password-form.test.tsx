import type { ReactElement } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(), replace: vi.fn(), setState: vi.fn(), ref: vi.fn(),
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useEffect: vi.fn(),
  useRef: mocks.ref,
  useState: (initial: unknown) => [initial === "checking" ? "ready" : initial, mocks.setState],
}));
vi.mock("./password-session", () => ({
  updatePasswordForTarget: mocks.update,
  createPasswordSessionInitializer: vi.fn(),
}));
vi.mock("@/lib/supabase/browser", () => ({ createBrowserSupabaseClient: vi.fn() }));

import { PasswordSetupForm } from "./password-form";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ref.mockReturnValueOnce({ current: {} })
    .mockReturnValueOnce({ current: null })
    .mockReturnValueOnce({ current: "fictional-invited-user" });
  vi.stubGlobal("window", { location: { replace: mocks.replace } });
  vi.stubGlobal("FormData", class {
    get() { return "fictional-test-password"; }
  });
});
afterEach(() => vi.unstubAllGlobals());

async function submit() {
  const form = PasswordSetupForm() as ReactElement<{ onSubmit: (event: unknown) => Promise<void> }>;
  const reset = vi.fn();
  await form.props.onSubmit({ preventDefault: vi.fn(), currentTarget: { reset } });
  return reset;
}

test("automatically enters the authenticated backoffice after saving the password", async () => {
  mocks.update.mockResolvedValue("SUCCESS");
  const reset = await submit();
  expect(reset).toHaveBeenCalledOnce();
  expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/backoffice");
});

test.each(["SESSION_MISMATCH", "UPDATE_FAILED"])("keeps %s failures on the password form", async result => {
  mocks.update.mockResolvedValue(result);
  const reset = await submit();
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(reset).not.toHaveBeenCalled();
  expect(mocks.setState).toHaveBeenLastCalledWith(expect.objectContaining({ status: "error" }));
});

test("keeps authentication service failures on the password form", async () => {
  mocks.update.mockRejectedValue(new Error("fictional unavailable service"));
  await submit();
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(mocks.setState).toHaveBeenLastCalledWith(expect.objectContaining({ status: "error" }));
});
