import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../core/service", () => mocks);
import { createTaskAction, updateTaskAction, deleteTaskAction } from "./actions";
import type { TaskInput } from "../core/contracts";
const input: TaskInput = { assigneeId: "fictional-id", title: "Fictional task", description: "Fixture", dueDate: "2026-09-15", status: "completed" };
describe("task mutations invalidate visited follow-up pages", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it.each(["create", "update", "delete"])("refreshes task and dashboard after a successful %s", async (operation) => {
    mocks.createTask.mockResolvedValue({ ok: true }); mocks.updateTask.mockResolvedValue({ ok: true }); mocks.deleteTask.mockResolvedValue({ ok: true });
    if (operation === "create") await createTaskAction(input);
    else if (operation === "update") await updateTaskAction("fictional-id", input);
    else await deleteTaskAction("fictional-id");
    expect(mocks.revalidatePath.mock.calls).toEqual([["/tasks", "layout"], ["/dashboard"]]);
  });
  it("preserves denied writes without invalidating data", async () => {
    mocks.updateTask.mockResolvedValue({ ok: false, code: "PERMISSION_DENIED" });
    expect(await updateTaskAction("fictional-id", input)).toEqual({ ok: false, code: "PERMISSION_DENIED" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
