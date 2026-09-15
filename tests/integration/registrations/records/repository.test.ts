import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));
import type { Database } from "@/types/database.generated";
import { createRegistrationRepository } from "@/features/registrations/records/repository";

const eventId = "27000000-0000-4000-8000-000000000001";
const participantId = "27000000-0000-4000-8000-000000000002";
const id = "27000000-0000-4000-8000-000000000003";
const updated_at = "2026-09-08T12:00:00.123456+00:00";
const row = { id, updated_at, registration_status: "registered" };
type Reply = { body: unknown; status?: number; count?: string };
function setup(replies: Reply[]) {
  const requests: { url: URL; method: string; body: unknown }[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: new URL(String(input)), method: init?.method ?? "GET", body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
    const reply = replies.shift(); if (!reply) throw new Error("Unexpected request");
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { "Content-Type": "application/json", ...(reply.count ? { "Content-Range": reply.count } : {}) } });
  });
  const client = createClient<Database>("https://registration.example.test", "fictional-test-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } });
  return { repository: createRegistrationRepository(async () => client), requests };
}
describe("registration repository using the real Supabase SDK at a simulated HTTP boundary", () => {
  it("sends only allowed columns; database supplies status and audit fields", async () => {
    const { repository, requests } = setup([{ body: row }]);
    expect(await repository.create({ eventId, participantId })).toEqual({ created: true, status: "registered" });
    expect(requests[0].body).toEqual({ event_id: eventId, participant_id: participantId, privacy_notice_acknowledged_at: null });
    expect(requests[0].method).toBe("POST");
  });
  it("reads the exact unique pair after conflict without restoring a cancelled row", async () => {
    const { repository, requests } = setup([{ status: 409, body: { code: "23505" } }, { body: [{ ...row, registration_status: "cancelled" }] }]);
    expect(await repository.create({ eventId, participantId })).toEqual({ created: false, status: "cancelled" });
    expect(requests[1].method).toBe("GET");
    expect(requests[1].url.searchParams.get("event_id")).toBe(`eq.${eventId}`);
    expect(requests[1].url.searchParams.get("participant_id")).toBe(`eq.${participantId}`);
    expect(requests).toHaveLength(2);
  });
  it("does not treat an unreadable conflict row as successful registration", async () => {
    const { repository } = setup([{ status: 409, body: { code: "23505" } }, { body: [] }]);
    await expect(repository.create({ eventId, participantId })).rejects.toThrow("Registration persistence failed");
  });
  it("updates only status with event/id/version filters", async () => {
    const { repository, requests } = setup([{ body: [row] }, { body: { ...row, registration_status: "cancelled" } }]);
    expect(await repository.update({ eventId, registrationId: id, status: "cancelled", expectedUpdatedAt: updated_at })).toBe("updated");
    expect(requests[1].body).toEqual({ registration_status: "cancelled" });
    for (const [key, value] of Object.entries({ event_id: eventId, id, updated_at })) expect(requests[1].url.searchParams.get(key)).toBe(`eq.${value}`);
  });
  it.each(["registered", "cancelled"] as const)("classifies a concurrent %s result without another write", async (status) => {
    const { repository, requests } = setup([{ body: [row] }, { body: [] }, { body: [{ ...row, registration_status: status }] }]);
    expect(await repository.update({ eventId, registrationId: id, status: "cancelled", expectedUpdatedAt: updated_at })).toBe(status === "cancelled" ? "unchanged" : "conflict");
    expect(requests.filter((request) => request.method === "PATCH")).toHaveLength(1);
  });
  it("does not write a repeated desired status", async () => {
    const { repository, requests } = setup([{ body: [row] }]);
    expect(await repository.update({ eventId, registrationId: id, status: "registered", expectedUpdatedAt: updated_at })).toBe("unchanged");
    expect(requests).toHaveLength(1);
  });
  it("does not update a missing or different-event registration", async () => {
    const { repository, requests } = setup([{ body: [] }]);
    expect(await repository.update({ eventId, registrationId: id, status: "cancelled", expectedUpdatedAt: updated_at })).toBe("unavailable");
    expect(requests).toHaveLength(1);
  });
  it("projects only list fields and preserves the total beyond this page", async () => {
    const { repository, requests } = setup([{ body: [{ id: eventId }] }, { count: "25-25/51", body: [{ ...row, privacy_notice_acknowledged_at: null, participants: { full_name: "Fictional Participant", email: "person@example.test", student_id: "SHOULD-NOT-LEAK" }, recorded_by: "SHOULD-NOT-LEAK" }] }]);
    expect(await repository.list(eventId, 2)).toEqual({ items: [{ id, status: "registered", updatedAt: updated_at, privacyNoticeAcknowledgedAt: null, participantName: "Fictional Participant", participantEmail: "person@example.test" }], total: 51 });
    expect(requests[1].url.searchParams.get("offset")).toBe("25");
    expect(requests[1].url.searchParams.get("limit")).toBe("25");
    expect(requests[1].url.searchParams.get("select")).not.toContain("student_id");
  });
  it("uses only the safe aggregate RPC and discards other fields", async () => {
    const { repository, requests } = setup([{ body: [{ event_id: eventId, registration_count: 3, attendance_count: 2, name: "SHOULD-NOT-LEAK" }] }]);
    expect(await repository.count(eventId)).toBe(3);
    expect(requests[0].url.pathname).toBe("/rest/v1/rpc/get_event_participation_totals");
    expect(requests[0].body).toEqual({ event_ids: [eventId] });
  });
  it.each([-1, 1.2, "3", null])("rejects malformed aggregate %s instead of rendering zero", async (value) => {
    const { repository } = setup([{ body: [{ event_id: eventId, registration_count: value }] }]);
    await expect(repository.count(eventId)).rejects.toThrow("Registration persistence failed");
  });
});

it("searches both identity columns within the event before paginating", async () => {
  const { repository, requests } = setup([{ body: [{ id: eventId }] }, { count: "25-25/26", body: [] }]);
  await repository.list(eventId, 2, 'Fictional.*,"Name"');
  const query = requests[1].url.searchParams;
  expect(query.get("event_id")).toBe(`eq.${eventId}`);
  expect(query.get("participants.or")).toBe('(full_name.imatch."Fictional\\\\.\\\\*,\\"Name\\"",email.imatch."Fictional\\\\.\\\\*,\\"Name\\"")');
  expect(query.get("select")).toContain("participants!inner(full_name,email)");
  expect(query.get("offset")).toBe("25");
});
