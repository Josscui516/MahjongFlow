import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
import { TaskFilters } from "./TaskFilters";
import { TaskSort } from "./TaskSort";
import { parseTaskFilterCriteria } from "./search-params";

describe("task list controls", () => {
  it("renders automatic filters and a sort control belonging to the same form", () => {
    const parsed = parseTaskFilterCriteria({ sort: "updated_recent", dueFrom: "2026-10-21" });
    if (!parsed.ok) throw new Error("Invalid fixture");
    const html = renderToStaticMarkup(<><TaskFilters criteria={parsed.criteria} assigneeLabels={new Map()} /><TaskSort criteria={parsed.criteria} /></>);
    expect(html).not.toContain('type="submit"');
    expect(html).toContain('form="task-filters"');
    expect(html).toContain('value="updated_recent" selected=""');
    expect(html).toContain('open=""');
    expect(html).toContain("Due date from");
    expect(parsed.criteria.pageSize).toBe(10);
  });
});
