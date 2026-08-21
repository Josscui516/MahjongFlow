import { describe, expect, it, vi } from "vitest";

import {
  createPasswordSessionInitializer,
  establishPasswordSetupSession,
  parsePasswordSetupLink,
  type PasswordAuthClient,
  updatePasswordForTarget,
} from "./password-session";

function createClient(options?: Readonly<{ currentUserId?: string; linkUserId?: string }>) {
  const updateUser = vi.fn(async () => ({ error: null }));
  const client: PasswordAuthClient = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: options?.currentUserId ? { id: options.currentUserId } : null },
        error: null,
      })),
      setSession: vi.fn(async () => ({
        data: { user: options?.linkUserId ? { id: options.linkUserId } : null },
        error: null,
      })),
      updateUser,
    },
  };

  return { client, updateUser };
}

describe("password setup link", () => {
  it("accepts only complete invite or recovery fragments", () => {
    expect(
      parsePasswordSetupLink(
        "#access_token=access&refresh_token=refresh&type=invite",
      ),
    ).toEqual({
      accessToken: "access",
      refreshToken: "refresh",
      type: "invite",
    });
    expect(
      parsePasswordSetupLink(
        "#access_token=access&refresh_token=refresh&type=recovery",
      ),
    ).toEqual({
      accessToken: "access",
      refreshToken: "refresh",
      type: "recovery",
    });
    expect(parsePasswordSetupLink("#access_token=access&type=invite")).toBeNull();
    expect(
      parsePasswordSetupLink(
        "#access_token=access&refresh_token=refresh&type=signup",
      ),
    ).toBeNull();
  });

  it("establishes the session represented by the link", async () => {
    const { client } = createClient({ linkUserId: "invited-user" });

    await expect(
      establishPasswordSetupSession(
        client,
        "#access_token=access&refresh_token=refresh&type=invite",
      ),
    ).resolves.toEqual({ status: "ready", userId: "invited-user" });
    expect(client.auth.setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh",
    });
  });

  it("establishes a link session only once when an effect is replayed", async () => {
    const { client } = createClient({ linkUserId: "invited-user" });
    const initialize = createPasswordSessionInitializer(
      client,
      "#access_token=access&refresh_token=refresh&type=recovery",
    );

    await expect(initialize()).resolves.toEqual({
      status: "ready",
      userId: "invited-user",
    });
    await expect(initialize()).resolves.toEqual({
      status: "ready",
      userId: "invited-user",
    });
    expect(client.auth.setSession).toHaveBeenCalledTimes(1);
  });

  it("rejects password mutation when the verified user differs from the link user", async () => {
    const { client, updateUser } = createClient({ currentUserId: "administrator" });

    await expect(
      updatePasswordForTarget(client, "invited-user", "fictional-password"),
    ).resolves.toBe("SESSION_MISMATCH");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates the password only for the verified link user", async () => {
    const { client, updateUser } = createClient({ currentUserId: "invited-user" });

    await expect(
      updatePasswordForTarget(client, "invited-user", "fictional-password"),
    ).resolves.toBe("SUCCESS");
    expect(updateUser).toHaveBeenCalledWith({ password: "fictional-password" });
  });
});
