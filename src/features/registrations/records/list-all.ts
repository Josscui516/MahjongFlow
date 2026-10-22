import { REGISTRATION_PAGE_SIZE, type RegistrationListResult } from "./contracts";

/** Preserve paging and fail closed rather than showing a partial event roster. */
export async function listAllRegistrations(eventId: string, list: (eventId: string, page: number) => Promise<RegistrationListResult>): Promise<RegistrationListResult> {
  const first = await list(eventId, 1);
  if (!first.ok) return first;
  const items = [...first.items];
  const pageCount = Math.ceil(first.total / REGISTRATION_PAGE_SIZE);
  for (let page = 2; page <= pageCount; page += 4) {
    const batch = await Promise.all(Array.from(
      { length: Math.min(4, pageCount - page + 1) },
      (_, index) => list(eventId, page + index),
    ));
    for (const next of batch) {
      if (!next.ok) return next;
      items.push(...next.items);
    }
  }
  return { ...first, items: [...new Map(items.map(item => [item.id, item])).values()] };
}
