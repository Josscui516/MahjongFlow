import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AuthorizationError } from "@/lib/auth/authorization";
import { ManualAttendanceRepositoryError, type ManualAttendanceWriteResult } from "./repository";
import { createManualAttendanceService, type ManualAttendanceDependencies } from "./service";

const EVENT_ID = "33abcdef-0000-4000-8000-000000000001";
const RECORD_ID = "33abcdef-0000-4000-8000-000000000002";
const VERSION = "2026-09-28T04:12:34.123456+00:00";
const UPDATED_VERSION = "2026-09-28T04:12:35.987654+00:00";
const AUTHORISED = {
  canManageAccounts: false,
  displayName: "Fictional Authorised User",
  role: "authorised" as const,
  userId: "33000000-0000-4000-8000-000000000031",
};

function createForm() {
  const form = new FormData();
  form.set("operation", "create");
  form.set("email", " FICTIONAL.PARTICIPANT@EXAMPLE.TEST ");
  form.set("confirmation", "confirmed");
  return form;
}

function setup(overrides: Partial<ManualAttendanceDependencies> = {}) {
  const calls: string[] = [];
  const execute = vi.fn(async (): Promise<ManualAttendanceWriteResult> => {
    calls.push("repository");
    return { outcome: "updated", eventId: EVENT_ID, updatedAt: UPDATED_VERSION };
  });
  const dependencies: ManualAttendanceDependencies = {
    authorise: vi.fn(async () => { calls.push("authorise"); return AUTHORISED; }),
    repository: { execute },
    ...overrides,
  };
  return { calls, dependencies, service: createManualAttendanceService(dependencies) };
}

describe("manual attendance service", () => {
  it("authorises before parsing and persistence, then returns only the refresh contract", async () => {
    const context = setup();
    const form = createForm();
    const getAll = form.getAll.bind(form);
    vi.spyOn(form, "getAll").mockImplementation((name) => { context.calls.push("parse"); return getAll(name); });
    form.set("recordedBy", "forged-actor");
    form.set("updatedAt", "forged-time");
    form.set("checkInMethod", "qr");
    await expect(context.service.submit(EVENT_ID.toUpperCase(), form)).resolves.toEqual({ status: "success", eventId: EVENT_ID, updatedAt: UPDATED_VERSION });
    expect(context.calls[0]).toBe("authorise");
    expect(context.calls.at(-1)).toBe("repository");
    expect(context.dependencies.repository.execute).toHaveBeenCalledExactlyOnceWith({
      operation: "create", eventId: EVENT_ID, email: "fictional.participant@example.test",
    });
  });

  it("forwards the exact version for a confirmed-to-voided correction", async () => {
    const context = setup();
    const form = new FormData();
    form.set("operation", "correct");
    form.set("recordId", RECORD_ID);
    form.set("expectedUpdatedAt", VERSION);
    form.set("targetStatus", "voided");
    form.set("confirmation", "confirmed");
    await expect(context.service.submit(EVENT_ID, form)).resolves.toEqual({ status: "success", eventId: EVENT_ID, updatedAt: UPDATED_VERSION });
    expect(context.dependencies.repository.execute).toHaveBeenCalledExactlyOnceWith({
      operation: "correct", eventId: EVENT_ID, recordId: RECORD_ID, expectedUpdatedAt: VERSION, targetStatus: "voided",
    });
  });

  it.each([
    ["anonymous participant", "UNAUTHENTICATED", "unauthenticated"],
    ["committee", "FORBIDDEN", "permission-denied"],
    ["missing active profile", "FORBIDDEN", "permission-denied"],
  ] as const)("denies %s before touching attacker input or repository", async (_role, code, status) => {
    const context = setup({ authorise: vi.fn(async () => { throw new AuthorizationError(code); }) });
    const getAll = vi.fn(() => { throw new Error("Input must not be parsed"); });
    const form = { getAll } as unknown as FormData;
    await expect(context.service.submit("not-an-id", form)).resolves.toEqual({ status });
    expect(getAll).not.toHaveBeenCalled();
    expect(context.dependencies.repository.execute).not.toHaveBeenCalled();
  });

  it("keeps an unexpected auth failure safe and does not parse or persist", async () => {
    const context = setup({ authorise: vi.fn(async () => { throw new Error("private auth detail"); }) });
    const form = createForm();
    const getAll = vi.spyOn(form, "getAll");
    await expect(context.service.submit(EVENT_ID, form)).resolves.toEqual({ status: "system-error" });
    expect(getAll).not.toHaveBeenCalled();
    expect(context.dependencies.repository.execute).not.toHaveBeenCalled();
  });

  it("returns field feedback without persistence for a failed confirmation", async () => {
    const context = setup();
    const form = createForm();
    form.delete("confirmation");
    await expect(context.service.submit(EVENT_ID, form)).resolves.toEqual({
      status: "validation", errors: [{ field: "confirmation", message: "Confirm this attendance change before saving." }],
    });
    expect(context.dependencies.authorise).toHaveBeenCalledOnce();
    expect(context.dependencies.repository.execute).not.toHaveBeenCalled();
  });

  it("validates the bound event before repository access", async () => {
    const context = setup();
    await expect(context.service.submit("not-an-event", createForm())).resolves.toMatchObject({
      status: "validation", errors: [expect.objectContaining({ field: "eventId" })],
    });
    expect(context.dependencies.repository.execute).not.toHaveBeenCalled();
  });

  it("maps missing participants to authorised-only email feedback", async () => {
    const execute = vi.fn(async (): Promise<ManualAttendanceWriteResult> => ({ outcome: "participant-missing" }));
    const context = setup({ repository: { execute } });
    await expect(context.service.submit(EVENT_ID, createForm())).resolves.toEqual({
      status: "validation", errors: [{ field: "email", message: "No existing participant matches that email. Check the participant details first." }],
    });
    expect(execute).toHaveBeenCalledOnce();
  });

  it.each(["conflict", "unavailable"] as const)("preserves %s without retrying a write", async (outcome) => {
    const execute = vi.fn(async (): Promise<ManualAttendanceWriteResult> => ({ outcome }));
    const context = setup({ repository: { execute } });
    await expect(context.service.submit(EVENT_ID, createForm())).resolves.toEqual({ status: outcome });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("refuses a persisted success from the wrong event", async () => {
    const context = setup({ repository: { execute: vi.fn(async (): Promise<ManualAttendanceWriteResult> => ({ outcome: "updated", eventId: RECORD_ID, updatedAt: UPDATED_VERSION })) } });
    await expect(context.service.submit(EVENT_ID, createForm())).resolves.toEqual({ status: "system-error" });
  });

  it.each([
    ["42501", "permission-denied"], ["PGRST301", "permission-denied"],
    ["23505", "duplicate"], ["23503", "unavailable"],
    ["40001", "system-error"], ["40P01", "system-error"],
    ["INVALID_DATA", "system-error"], ["XX000", "system-error"],
  ] as const)("safely maps database %s to %s", async (code, status) => {
    const execute = vi.fn(async () => { throw new ManualAttendanceRepositoryError(code); });
    const context = setup({ repository: { execute } });
    await expect(context.service.submit(EVENT_ID, createForm())).resolves.toEqual({ status });
    expect(execute).toHaveBeenCalledOnce();
  });

  it.each(["40001", "40P01"])("allows an explicitly resubmitted correction after rolled-back %s without an automatic retry", async (code) => {
    const calls: string[] = [];
    const authorise = vi.fn(async () => { calls.push("authorise"); return AUTHORISED; });
    const execute = vi.fn(async (): Promise<ManualAttendanceWriteResult> => {
      calls.push("repository");
      return { outcome: "updated", eventId: EVENT_ID, updatedAt: UPDATED_VERSION };
    }).mockImplementationOnce(async () => {
      calls.push("repository");
      throw new ManualAttendanceRepositoryError(code);
    });
    const context = setup({ authorise, repository: { execute } });
    const form = new FormData();
    form.set("operation", "correct");
    form.set("recordId", RECORD_ID);
    form.set("expectedUpdatedAt", VERSION);
    form.set("targetStatus", "voided");
    form.set("confirmation", "confirmed");

    await expect(context.service.submit(EVENT_ID, form)).resolves.toEqual({ status: "system-error" });
    expect(authorise).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce();

    await expect(context.service.submit(EVENT_ID, form)).resolves.toEqual({ status: "success", eventId: EVENT_ID, updatedAt: UPDATED_VERSION });
    expect(authorise).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(calls).toEqual(["authorise", "repository", "authorise", "repository"]);
    expect(execute.mock.calls[1]).toEqual(execute.mock.calls[0]);
    expect(form.get("expectedUpdatedAt")).toBe(VERSION);
  });

  it.each(["23514", "22P02", "22007", "22008"])("maps database validation %s back to field feedback", async (code) => {
    const context = setup({ repository: { execute: vi.fn(async () => { throw new ManualAttendanceRepositoryError(code); }) } });
    await expect(context.service.submit(EVENT_ID, createForm())).resolves.toEqual({
      status: "validation", errors: [{ field: "operation", message: "The attendance change is invalid. Refresh the records and check your selection." }],
    });
  });

  it("does not expose raw error messages or trust an arbitrary object's code", async () => {
    const context = setup({ repository: { execute: vi.fn(async () => { throw { code: "23505", message: "private database detail" }; }) } });
    await expect(context.service.submit(EVENT_ID, createForm())).resolves.toEqual({ status: "system-error" });
  });
});
