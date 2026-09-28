import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  AuthorizationError,
  type AccessContext,
} from "@/lib/auth/authorization";

import {
  FICTIONAL_ATTENDANCE_EVENT,
  FICTIONAL_MANUAL_ATTENDANCE,
  FICTIONAL_QR_ATTENDANCE,
} from "./fixtures";
import {
  AttendanceAuditRepositoryError,
  type AttendanceAuditRepository,
} from "./repository";
import {
  createAttendanceAuditService,
  type AttendanceAuditDependencies,
} from "./service";

const AUTHORISED: AccessContext & Readonly<{ role: "authorised" }> = {
  canManageAccounts: false,
  displayName: "Fictional Authorised User",
  role: "authorised",
  userId: "32000000-0000-4000-8000-000000000031",
};

const SNAPSHOT = {
  event: FICTIONAL_ATTENDANCE_EVENT,
  items: [FICTIONAL_QR_ATTENDANCE, FICTIONAL_MANUAL_ATTENDANCE],
};

function setup(overrides: Partial<AttendanceAuditDependencies> = {}) {
  const calls: string[] = [];
  const repository: AttendanceAuditRepository = {
    listForEvent: vi.fn(async () => {
      calls.push("repository");
      return SNAPSHOT;
    }),
  };
  const dependencies: AttendanceAuditDependencies = {
    authorise: vi.fn(async () => {
      calls.push("authorise");
      return AUTHORISED;
    }),
    repository,
    ...overrides,
  };

  return {
    calls,
    dependencies,
    repository: dependencies.repository,
    service: createAttendanceAuditService(dependencies),
  };
}

describe("createAttendanceAuditService", () => {
  it("authorises before returning the event-scoped audit snapshot", async () => {
    const context = setup();

    await expect(
      context.service.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({ ...SNAPSHOT, ok: true });
    expect(context.calls).toEqual(["authorise", "repository"]);
    expect(context.repository.listForEvent).toHaveBeenCalledWith(
      FICTIONAL_ATTENDANCE_EVENT.id,
    );
  });

  it.each([
    ["UNAUTHENTICATED", "UNAUTHENTICATED"],
    ["FORBIDDEN", "PERMISSION_DENIED"],
  ] as const)(
    "maps %s before validating or reading attendance",
    async (authorizationCode, expectedCode) => {
      const repository: AttendanceAuditRepository = {
        listForEvent: vi.fn(),
      };
      const context = setup({
        authorise: vi.fn(async () => {
          throw new AuthorizationError(authorizationCode);
        }),
        repository,
      });

      await expect(context.service.listForEvent("not-an-id")).resolves.toEqual({
        code: expectedCode,
        ok: false,
      });
      expect(repository.listForEvent).not.toHaveBeenCalled();
    },
  );

  it("validates the event id only after successful authorisation", async () => {
    const context = setup();

    await expect(context.service.listForEvent("not-an-id")).resolves.toEqual({
      code: "VALIDATION",
      ok: false,
    });
    expect(context.calls).toEqual(["authorise"]);
    expect(context.repository.listForEvent).not.toHaveBeenCalled();
  });

  it("distinguishes an unavailable event from a successful empty audit", async () => {
    const unavailable = setup({
      repository: { listForEvent: vi.fn(async () => null) },
    });
    const empty = setup({
      repository: {
        listForEvent: vi.fn(async () => ({
          event: FICTIONAL_ATTENDANCE_EVENT,
          items: [],
        })),
      },
    });

    await expect(
      unavailable.service.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({ code: "UNAVAILABLE", ok: false });
    await expect(
      empty.service.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({
      event: FICTIONAL_ATTENDANCE_EVENT,
      items: [],
      ok: true,
    });
  });

  it("rejects a repository response for another event", async () => {
    const context = setup({
      repository: {
        listForEvent: vi.fn(async () => ({
          event: {
            ...FICTIONAL_ATTENDANCE_EVENT,
            id: "32000000-0000-4000-8000-000000000099",
          },
          items: [],
        })),
      },
    });

    await expect(
      context.service.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({ code: "SYSTEM_ERROR", ok: false });
  });

  it.each([
    ["42501", "PERMISSION_DENIED"],
    ["PGRST301", "PERMISSION_DENIED"],
    ["22P02", "VALIDATION"],
    ["INVALID_DATA", "SYSTEM_ERROR"],
  ] as const)("maps repository error %s to %s", async (code, expectedCode) => {
    const context = setup({
      repository: {
        listForEvent: vi.fn(async () => {
          throw new AttendanceAuditRepositoryError(code);
        }),
      },
    });

    await expect(
      context.service.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({ code: expectedCode, ok: false });
  });

  it("does not expose unexpected error details", async () => {
    const context = setup({
      repository: {
        listForEvent: vi.fn(async () => {
          throw new Error("sensitive database detail");
        }),
      },
    });

    await expect(
      context.service.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({ code: "SYSTEM_ERROR", ok: false });
  });
});
