import { PNG } from "pngjs";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AuthorizationError } from "@/lib/auth/authorization";

import type { CheckInTokenRepository, CheckInWindowInput } from "./contracts";
import { createCheckInTokenService } from "./service";

const eventId = "94000000-0000-4000-8000-000000000001";
const actorId = "91000000-0000-4000-8000-000000000001";
const token = "a".repeat(64);
const createdAt = "2026-09-16T04:00:00.000Z";

function repository(): CheckInTokenRepository {
  return {
    configureWindow: vi.fn(async (_eventId, _actorId, input) => input),
    getStatus: vi.fn(async () => ({ active: false, closesAt: null, createdAt: null, opensAt: null, revokedAt: null })),
    revoke: vi.fn(async () => createdAt),
    rotate: vi.fn(async () => ({ createdAt, token })),
  };
}

function service(repo = repository(), authorise = async () => ({ canManageAccounts: false, role: "authorised" as const, userId: actorId })) {
  return createCheckInTokenService({
    applicationUrl: () => "https://mahjong.example.test",
    authorise,
    createQr: (value) => QRCode.toDataURL(value, { margin: 2, width: 320 }),
    repository: repo,
  });
}

describe("event check-in token service", () => {
  it("returns validation feedback for a malformed direct action argument without writing", async () => {
    const repo = repository();
    await expect(service(repo).configureWindow(eventId, null as unknown as CheckInWindowInput))
      .resolves.toMatchObject({ ok: false, code: "VALIDATION" });
    expect(repo.configureWindow).not.toHaveBeenCalled();
  });

  it("returns a one-time event URL whose QR actually decodes", async () => {
    const result = await service().rotate(eventId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).toBe(`https://mahjong.example.test/check-in/${token}`);
    const png = PNG.sync.read(Buffer.from(result.qrDataUrl.split(",")[1], "base64"));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(decoded?.data).toBe(result.url);
    expect(result.url).not.toContain(eventId);
    expect(result.url).not.toMatch(/@|student/i);
  });

  it("authorises before persistence and maps denial to safe feedback", async () => {
    const repo = repository();
    const denied = service(repo, async () => { throw new AuthorizationError("FORBIDDEN"); });
    await expect(denied.rotate(eventId)).resolves.toEqual({ code: "PERMISSION_DENIED", ok: false });
    expect(repo.rotate).not.toHaveBeenCalled();
  });

  it("passes normalised windows and supports explicit revocation", async () => {
    const repo = repository();
    const sut = service(repo);
    await expect(sut.configureWindow(eventId, { opensAt: "2026-09-16T18:00", closesAt: "2026-09-16T21:00" })).resolves.toMatchObject({ ok: true });
    expect(repo.configureWindow).toHaveBeenCalledWith(eventId, actorId, {
      opensAt: "2026-09-16T08:00:00.000Z",
      closesAt: "2026-09-16T11:00:00.000Z",
    });
    await expect(sut.revoke(eventId)).resolves.toEqual({ ok: true });
    expect(repo.revoke).toHaveBeenCalledWith(eventId, actorId);
  });

  it("rejects invalid IDs and windows without touching persistence", async () => {
    const repo = repository();
    const sut = service(repo);
    await expect(sut.rotate("invalid")).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    await expect(sut.configureWindow(eventId, { opensAt: "2026-09-16T21:00", closesAt: "2026-09-16T18:00" })).resolves.toMatchObject({ code: "VALIDATION", ok: false });
    expect(repo.rotate).not.toHaveBeenCalled();
    expect(repo.configureWindow).not.toHaveBeenCalled();
  });
});
