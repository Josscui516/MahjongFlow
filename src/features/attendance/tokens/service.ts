import "server-only";

import { networkInterfaces } from "node:os";
import { headers } from "next/headers";
import QRCode from "qrcode";

import {
  AuthorizationError,
  type AccessContext,
} from "@/lib/auth/authorization";
import { getSupabaseAdminEnvironment } from "@/lib/supabase/env";
import { requireQrManager } from "./authorization";
import { isLocalPreviewRequest, isPrivateIPv4, localNetworkHosts, resolveCheckInOrigin } from "@/lib/network/check-in-origin";

import type {
  CheckInTokenRepository,
  CheckInWindowInput,
  BasicTokenMutationResult,
  TokenMutationResult,
  TokenStatusResult,
  WindowMutationResult,
} from "./contracts";
import {
  CheckInTokenPersistenceError,
  checkInTokenRepository,
} from "./repository";
import { isEventId, validateCheckInWindow } from "./validation";

type Dependencies = Readonly<{
  applicationUrl: () => string | Promise<string>;
  authorise: () => Promise<AccessContext>;
  createQr: (value: string) => Promise<string>;
  repository: CheckInTokenRepository;
}>;

function failure(error: unknown): Readonly<{ code: "PERMISSION_DENIED" | "SYSTEM_ERROR" | "EVENT_NOT_SCHEDULED" | "WINDOW_REQUIRED" | "NOT_FOUND"; ok: false }> {
  if (error instanceof CheckInTokenPersistenceError) {
    if (error.code === "PQR01") return { code: "EVENT_NOT_SCHEDULED", ok: false };
    if (error.code === "PQR02") return { code: "WINDOW_REQUIRED", ok: false };
    if (error.code === "P0002") return { code: "NOT_FOUND", ok: false };
  }
  if (error instanceof AuthorizationError || (error instanceof CheckInTokenPersistenceError && error.code === "42501")) {
    return { code: "PERMISSION_DENIED", ok: false };
  }
  return { code: "SYSTEM_ERROR", ok: false };
}

export function createCheckInTokenService({ applicationUrl, authorise, createQr, repository }: Dependencies) {
  return {
    async configureWindow(eventId: string, input: CheckInWindowInput): Promise<WindowMutationResult> {
      if (!isEventId(eventId)) return { code: "NOT_FOUND", ok: false };
      const checked = validateCheckInWindow(input);
      if (!checked.ok) return { code: "VALIDATION", errors: checked.errors, ok: false };
      try {
        const access = await authorise();
        const updated = await repository.configureWindow(eventId, access.userId, checked.value);
        return updated ? { ...updated, ok: true } : { code: "NOT_FOUND", ok: false };
      } catch (error) {
        return failure(error);
      }
    },
    async getStatus(eventId: string): Promise<TokenStatusResult> {
      if (!isEventId(eventId)) return { code: "NOT_FOUND", ok: false };
      try {
        const access = await authorise();
        const status = await repository.getStatus(eventId, access.userId);
        return status ? { ok: true, status } : { code: "NOT_FOUND", ok: false };
      } catch (error) {
        return failure(error);
      }
    },
    async revoke(eventId: string): Promise<BasicTokenMutationResult> {
      if (!isEventId(eventId)) return { code: "NOT_FOUND", ok: false };
      try {
        const access = await authorise();
        await repository.revoke(eventId, access.userId);
        return { ok: true };
      } catch (error) {
        return failure(error);
      }
    },
    async rotate(eventId: string): Promise<TokenMutationResult> {
      if (!isEventId(eventId)) return { code: "NOT_FOUND", ok: false };
      try {
        const access = await authorise();
        const origin = await applicationUrl();
        const generated = await repository.rotate(eventId, access.userId);
        if (!generated) return { code: "NOT_FOUND", ok: false };
        const url = `${origin}/register/${generated.token}`;
        const qrDataUrl = await createQr(url);
        return { createdAt: generated.createdAt, ok: true, qrDataUrl, url };
      } catch (error) {
        return failure(error);
      }
    },
  };
}

export const checkInTokenService = createCheckInTokenService({
  applicationUrl: async () => {
    const dockerHost = process.env.LOCAL_DOCKER_HOST_IP;
    const canonicalOrigin = getSupabaseAdminEnvironment().applicationUrl;
    const hosts = dockerHost && isPrivateIPv4(dockerHost) ? [dockerHost] : localNetworkHosts(networkInterfaces());
    const requestHost = (await headers()).get("host");
    const local = process.env.NODE_ENV === "development" || Boolean(dockerHost && isPrivateIPv4(dockerHost))
      // Docker must supply its host address; never use a container's private interface as the LAN destination.
      || (process.env.NEXT_PUBLIC_SUPABASE_SAME_ORIGIN !== "true"
        && isLocalPreviewRequest({ canonicalOrigin, requestHost, hosts }));
    return resolveCheckInOrigin({
    canonicalOrigin,
    development: local,
    requestHost: local ? requestHost : null,
    hosts,
    });
  },
  authorise: requireQrManager,
  createQr: (value) => QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 2, width: 320 }),
  repository: checkInTokenRepository,
});
