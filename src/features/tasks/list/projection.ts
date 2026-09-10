import type { TaskRecordDTO } from "../core/contracts";
import type { TaskFilterCriteria } from "./search-params";

export function filterAndSortTasks(items: readonly TaskRecordDTO[], criteria: TaskFilterCriteria) {
  const needle = criteria.search.toLocaleLowerCase("en-AU");
  return items
    .filter((item) => !criteria.assigneeId || item.assigneeId === criteria.assigneeId)
    .filter((item) => criteria.status === "all" || item.status === criteria.status)
    .filter((item) => !criteria.dueFrom || item.dueDate >= criteria.dueFrom)
    .filter((item) => !criteria.dueTo || item.dueDate <= criteria.dueTo)
    .filter((item) => !criteria.eventId || item.eventId === criteria.eventId)
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

export function queryTaskFollowUp(items: readonly TaskRecordDTO[], criteria: TaskFilterCriteria) { const filtered = filterAndSortTasks(items, criteria); return { items: filtered, total: filtered.length } as const; }
