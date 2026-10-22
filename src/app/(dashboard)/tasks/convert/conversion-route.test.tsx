import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  };
});

const authMocks = vi.hoisted(() => ({ requireBackendUser: vi.fn() }));
const sourceMocks = vi.hoisted(() => ({ read: vi.fn() }));
const assigneeMocks = vi.hoisted(() => ({ listAssigneeOptions: vi.fn() }));

vi.mock("@/lib/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/authorization")>();
  return { ...actual, requireBackendUser: authMocks.requireBackendUser };
});

vi.mock("@/features/tasks/conversion/source/persistence", () => ({
  createTaskConversionPort: vi.fn(),
  createTaskSourceReader: () => ({ read: sourceMocks.read }),
}));

vi.mock("@/features/tasks/conversion/source/actions", () => ({
  convertTaskSourceAction: vi.fn(),
}));

vi.mock("@/features/tasks/conversion/validation/actions", () => ({
  submitTaskConversionAction: vi.fn(),
}));

vi.mock("@/features/tasks/editor/server", () => ({
  listAssigneeOptions: assigneeMocks.listAssigneeOptions,
}));

import TaskConversionPage from "./[sourceKind]/[sourceId]/page";
import { AuthorizationError } from "@/lib/auth/authorization";

const source = {
  meetingId: "30000000-0000-4000-8000-000000000001",
  sourceContent: "Approve the fictional venue booking.",
  sourceId: "32000000-0000-4000-8000-000000000001",
  sourceKind: "decision" as const,
};

describe("task conversion route", () => {
  beforeEach(() => {
    authMocks.requireBackendUser.mockReset();
    sourceMocks.read.mockReset();
    assigneeMocks.listAssigneeOptions.mockReset();
    authMocks.requireBackendUser.mockResolvedValue({ role: "committee", userId: "fictional-user" });
    sourceMocks.read.mockResolvedValue(source);
    assigneeMocks.listAssigneeOptions.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", label: "Alex Example" },
    ]);
  });

  it("renders trusted source context and an actionable task form", async () => {
    const html = renderToStaticMarkup(await TaskConversionPage({
      params: Promise.resolve({ sourceId: source.sourceId, sourceKind: source.sourceKind }),
    }));

    expect(html).toContain("Approve the fictional venue booking.");
    expect(html).toContain("Task details");
    expect(html).toContain('id="task-conversion-title"');
    expect(html).toContain("Create task");
    expect(html).toContain("Alex Example");
    expect(html).not.toContain("Task fields are supplied");
  });

  it("defaults to the signed-in member rather than the first assignee", async () => {
    const currentId = "22222222-2222-4222-8222-222222222222";
    authMocks.requireBackendUser.mockResolvedValue({ role: "committee", userId: currentId });
    assigneeMocks.listAssigneeOptions.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", label: "Other Example" },
      { id: currentId, label: "Current Example" },
    ]);
    const html = renderToStaticMarkup(await TaskConversionPage({ params: Promise.resolve({ sourceId: source.sourceId, sourceKind: source.sourceKind }) }));
    expect(html).toContain('value="Approve the"');
    expect(html).toContain(`value="${currentId}" selected=""`);
    expect(html).toContain("Approve the fictional venue booking.");
  });

  it("uses the route not-found boundary for an invalid source identifier", async () => {
    await expect(TaskConversionPage({
      params: Promise.resolve({ sourceId: "not-a-uuid", sourceKind: "decision" }),
    })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    expect(sourceMocks.read).not.toHaveBeenCalled();
  });

  it("redirects an anonymous direct request before reading source content", async () => {
    authMocks.requireBackendUser.mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"));

    await expect(TaskConversionPage({
      params: Promise.resolve({ sourceId: source.sourceId, sourceKind: "decision" }),
    })).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    expect(sourceMocks.read).not.toHaveBeenCalled();
  });
});
