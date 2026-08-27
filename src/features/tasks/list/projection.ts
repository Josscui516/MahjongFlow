import type { TaskRecordDTO } from "../core/contracts";
import type { TaskListCriteria } from "./search-params";

export function filterAndSortTasks(items: readonly TaskRecordDTO[], criteria: TaskListCriteria) {
  const needle = criteria.search.toLocaleLowerCase("en-AU");
  return items
    .filter((item) => criteria.status === "all" || item.status === criteria.status)
    .filter((item) => !needle || `${item.title}\n${item.description}`.toLocaleLowerCase("en-AU").includes(needle))
    .toSorted((left, right) => {
      const comparison = criteria.sort === "updated_recent"
        ? right.updatedAt.localeCompare(left.updatedAt)
        : criteria.sort === "due_latest"
          ? right.dueDate.localeCompare(left.dueDate)
          : left.dueDate.localeCompare(right.dueDate);
      return comparison || left.id.localeCompare(right.id);
    });
}
