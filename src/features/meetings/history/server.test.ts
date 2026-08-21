import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class TestAuthorizationError extends Error {
    readonly code: "FORBIDDEN" | "UNAUTHENTICATED";

    constructor(code: "FORBIDDEN" | "UNAUTHENTICATED") {
      super(code);
      this.code = code;
    }
  }

  return {
    AuthorizationError: TestAuthorizationError,
    createServerSupabaseClient: vi.fn(),
    requireBackendUser: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: mocks.AuthorizationError,
  requireBackendUser: mocks.requireBackendUser,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import {
  getMeetingHistoryAccess,
  queryMeetingHistory,
} from "./server";

const CRITERIA = {
  page: 1,
  pageSize: 8,
  search: "",
  sort: "newest",
  time: "all",
} as const;

function createQueryBuilder(
  result: Readonly<{ count: number | null; data: unknown; error: unknown }>,
) {
  const resolvedResult = Promise.resolve(result);
  const builder = {
    gte: vi.fn(),
    ilike: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    then: resolvedResult.then.bind(resolvedResult),
  };

  builder.gte.mockReturnValue(builder);
  builder.ilike.mockReturnValue(builder);
  builder.lt.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockReturnValue(builder);

  return builder;
}

describe("meeting history server adapter", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockReset();
    mocks.requireBackendUser.mockReset();
  });

  it.each(["committee", "authorised"] as const)(
    "maps a trusted %s context without changing it",
    async (role) => {
      mocks.requireBackendUser.mockResolvedValue({
        canManageAccounts: false,
        role,
        userId: "00000000-0000-4000-8000-000000000010",
      });

      await expect(getMeetingHistoryAccess()).resolves.toEqual({
        context: {
          canManageAccounts: false,
          role,
          userId: "00000000-0000-4000-8000-000000000010",
        },
        ok: true,
      });
    },
  );

  it.each([
    ["UNAUTHENTICATED", "unauthenticated"],
    ["FORBIDDEN", "forbidden"],
  ] as const)("maps %s to a safe %s result", async (code, reason) => {
    mocks.requireBackendUser.mockRejectedValue(
      new mocks.AuthorizationError(code),
    );

    await expect(getMeetingHistoryAccess()).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it("fails closed when the access provider throws an unknown error", async () => {
    mocks.requireBackendUser.mockRejectedValue(
      new Error("private authentication provider detail"),
    );

    await expect(getMeetingHistoryAccess()).resolves.toEqual({
      ok: false,
      reason: "system-error",
    });
  });

  it("uses the user-cookie client, a safe field list, and deterministic database ordering", async () => {
    const queryBuilder = createQueryBuilder({
      count: 2,
      data: [
        {
          id: "older-id",
          starts_at: "2026-08-01T00:00:00.000Z",
          summary: null,
          title: "Older fictional meeting",
        },
        {
          id: "newer-id",
          starts_at: "2026-08-02T00:00:00.000Z",
          summary: "Updated fictional notes",
          title: "Newer fictional meeting",
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue(queryBuilder);
    const from = vi.fn().mockReturnValue({ select });
    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await expect(queryMeetingHistory(CRITERIA)).resolves.toEqual({
      ok: true,
      result: {
        items: [
          {
            id: "newer-id",
            startsAt: "2026-08-02T00:00:00.000Z",
            summary: "Updated fictional notes",
            title: "Newer fictional meeting",
          },
          {
            id: "older-id",
            startsAt: "2026-08-01T00:00:00.000Z",
            summary: null,
            title: "Older fictional meeting",
          },
        ],
        page: 1,
        pageCount: 1,
        pageSize: 8,
        totalCount: 2,
      },
    });
    expect(from).toHaveBeenCalledWith("meetings");
    expect(select).toHaveBeenCalledWith("id,title,starts_at,summary", {
      count: "exact",
    });
    expect(queryBuilder.order.mock.calls).toEqual([
      ["starts_at", { ascending: false }],
      ["id", { ascending: true }],
    ]);
    expect(queryBuilder.range).toHaveBeenCalledWith(0, 7);
  });

  it("applies escaped title search, time filtering, sorting, and pagination", async () => {
    const queryBuilder = createQueryBuilder({ count: 0, data: [], error: null });
    const select = vi.fn().mockReturnValue(queryBuilder);
    const from = vi.fn().mockReturnValue({ select });
    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await queryMeetingHistory({
      page: 2,
      pageSize: 8,
      search: "50%_plan",
      sort: "oldest",
      time: "upcoming",
    });

    expect(queryBuilder.ilike).toHaveBeenCalledWith(
      "title",
      "%50\\%\\_plan%",
    );
    expect(queryBuilder.gte).toHaveBeenCalledWith(
      "starts_at",
      expect.any(String),
    );
    expect(queryBuilder.order.mock.calls).toEqual([
      ["starts_at", { ascending: true }],
      ["id", { ascending: true }],
    ]);
    expect(queryBuilder.range).toHaveBeenCalledWith(8, 15);
  });

  it("does not expose a provider failure", async () => {
    const queryBuilder = createQueryBuilder({
      count: null,
      data: null,
      error: new Error("private database policy detail"),
    });
    const select = vi.fn().mockReturnValue(queryBuilder);
    const from = vi.fn().mockReturnValue({ select });
    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    const result = await queryMeetingHistory(CRITERIA);

    expect(result).toEqual({
      error: "MEETING_HISTORY_UNAVAILABLE",
      ok: false,
    });
    expect(JSON.stringify(result)).not.toContain("database policy");
  });
});
