import { expect, it } from "vitest";
import { hasEventListFilters, defaultEventListParams, eventDateBounds, eventListHref, readEventFilters } from "./filters";
import { literalPattern } from "@/lib/search/literal-pattern";
it("uses inclusive Sydney calendar days across the spring DST change", () => {
  const { filters } = readEventFilters({ from: "2026-10-04", to: "2026-10-04" });
  expect(eventDateBounds(filters)).toEqual({ from: "2026-10-03T14:00:00.000Z", before: "2026-10-04T13:00:00.000Z" });
});
it.each([{ from: "2026-02-30" }, { from: "2026-10-05", to: "2026-10-04" }, { status: "fake" }, { page: "0" }, { page: ["1", "2"] }, { q: "x".repeat(101) }])("rejects malformed filters %j", params => { expect(readEventFilters(params).error).toBeTruthy(); });
it("retains filters across pagination and starts new searches on page one", () => {
  const { filters } = readEventFilters({ q: " Fictional & session ", status: "scheduled", from: "2026-10-01" });
  expect(eventListHref(filters, 2)).toBe("/events?q=Fictional+%26+session&status=scheduled&from=2026-10-01&page=2");
});
it("treats regex metacharacters and wildcard text literally", () => {
  const text = 'O"Name, (A.*) [x] \\ 100%_';
  const regex = new RegExp(literalPattern(text), "i");
  expect(regex.test(text)).toBe(true);
  expect(regex.test('O"Name, Anything x 100hello')).toBe(false);
});

it("defaults to scheduled events on the Sydney day across midnight and DST", () => {
  expect(defaultEventListParams({}, new Date("2026-10-20T13:00:00Z"))).toEqual({ status: "scheduled", from: "2026-10-21" });
  expect(defaultEventListParams({}, new Date("2026-10-03T14:00:00Z"))).toEqual({ status: "scheduled", from: "2026-10-04" });
  expect(defaultEventListParams({ view: "all" }, new Date())).toEqual({ view: "all" });
  expect(defaultEventListParams({ from: "2026-01-01" }, new Date())).toEqual({ from: "2026-01-01" });
  expect(eventListHref(readEventFilters({ view: "all" }).filters, 2)).toBe("/events?view=all&page=2");
});

it("validates sorting and preserves it through pagination", () => {
  expect(readEventFilters({sort:"invalid"}).error).toBeTruthy();
  expect(readEventFilters({sort:["latest","name"]}).error).toBeTruthy();
  expect(eventListHref(readEventFilters({sort:"latest",q:"Fictional"}).filters,2)).toBe("/events?sort=latest&q=Fictional&page=2");
});

it("hides clear for default views and sort-only changes but shows it for custom filters",()=>{
 const today="2026-10-21";
 for(const params of [{view:"all"},{view:"all",sort:"latest"},{status:"scheduled",from:today,sort:"name"}]) expect(hasEventListFilters(readEventFilters(params).filters,today)).toBe(false);
 for(const params of [{q:"workshop"},{status:"completed"},{status:"scheduled"},{from:"2026-10-22"},{to:today}]) expect(hasEventListFilters(readEventFilters(params).filters,today)).toBe(true);
});
