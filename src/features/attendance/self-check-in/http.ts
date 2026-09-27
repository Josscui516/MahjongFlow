import type { SelfCheckInResult } from "./contracts";
import { CHECK_IN_REQUEST_MAX_BYTES } from "./validation";

const NO_STORE = { "Cache-Control": "no-store" } as const;
type Submit = (source: string, token: string, body: unknown) => Promise<SelfCheckInResult>;

function statusFor(outcome: SelfCheckInResult["outcome"]): number {
  if (outcome === "rate_limited") return 429;
  if (outcome === "system_error") return 503;
  if (outcome === "unable_to_process") return 422;
  if (outcome === "unavailable") return 404;
  return 200;
}

function requestSource(request: Request): string {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function createCheckInPostHandler(submit: Submit) {
  return async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return Response.json({ outcome: "unable_to_process" }, { headers: NO_STORE, status: 415 });
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isFinite(declaredLength) || declaredLength > CHECK_IN_REQUEST_MAX_BYTES) return Response.json({ outcome: "unable_to_process" }, { headers: NO_STORE, status: 413 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > CHECK_IN_REQUEST_MAX_BYTES) return Response.json({ outcome: "unable_to_process" }, { headers: NO_STORE, status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return Response.json({ outcome: "unable_to_process" }, { headers: NO_STORE, status: 400 }); }
    const { token } = await params;
    const result = await submit(requestSource(request), token, body);
    return Response.json(result, { headers: NO_STORE, status: statusFor(result.outcome) });
  };
}
