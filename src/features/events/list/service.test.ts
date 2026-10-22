import { createClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));
import type { Database } from "@/types/database.generated";
import { AuthorizationError } from "@/lib/auth/authorization";
import { createEventBrowser } from "./service";
it("applies filters before deterministic pagination with a minimal projection", async () => {
  const urls: URL[] = [];
  const client = createClient<Database>("https://events.example.test", "fictional", { auth: { persistSession: false }, global: { fetch: async input => {
    urls.push(new URL(String(input)));
    return new Response("[]", { headers: { "Content-Type": "application/json", "Content-Range": "*/42" } });
  } } });
  const search = createEventBrowser({ authorise: async () => ({}), getClient: async () => client });
  expect(await search({ q: "Fictional.*", status: "scheduled", from: "2026-10-04", to: "2026-10-04", page: "2" })).toEqual({ ok: true, items: [], total: 42 });
  const q = urls[0].searchParams;
  expect(q.get("name")).toBe("imatch.Fictional\\.\\*");
  expect(q.get("status")).toBe("eq.scheduled");
  expect(q.get("starts_at")).toBe("gte.2026-10-03T14:00:00.000Z");
  expect(q.getAll("starts_at")[1]).toBe("lt.2026-10-04T13:00:00.000Z");
  expect(q.get("offset")).toBe("20"); expect(q.get("limit")).toBe("20");
  expect(q.get("order")).toBe("starts_at.asc,id.asc");
  expect(q.get("select")).not.toContain("description");
});
it("rejects unauthenticated requests before validation or client access", async () => {
  const getClient = vi.fn();
  const search = createEventBrowser({ authorise: async () => { throw new AuthorizationError("UNAUTHENTICATED"); }, getClient });
  expect(await search({})).toEqual({ ok: false, code: "PERMISSION_DENIED" }); expect(getClient).not.toHaveBeenCalled();
});
it("returns validation and system failures without fake zero results", async () => {
  const getClient = vi.fn().mockRejectedValue(new Error("private diagnostic"));
  const search = createEventBrowser({ authorise: async () => ({}), getClient });
  expect(await search({ status: "unknown" })).toMatchObject({ ok: false, code: "VALIDATION" });
  expect(getClient).not.toHaveBeenCalled();
  expect(await search({})).toEqual({ ok: false, code: "SYSTEM_ERROR" });
});

it.each([["latest", "starts_at.desc,id.asc"], ["name", "name.asc,id.asc"]])("orders %s before pagination", async (sort, order) => {
 let requested: URL | undefined;
 const client = createClient<Database>("https://events.example.test", "fictional", {auth:{persistSession:false},global:{fetch:async input => {requested=new URL(String(input));return new Response("[]",{headers:{"Content-Type":"application/json","Content-Range":"*/42"}});}}});
 const browse=createEventBrowser({authorise:async()=>({}),getClient:async()=>client});
 expect(await browse({sort,page:"2"})).toMatchObject({ok:true});
 expect(requested?.searchParams.get("order")).toBe(order);
 expect(requested?.searchParams.get("offset")).toBe("20");
});
