import { describe, expect, it } from "vitest";

import {
  validateAccountId,
  validateInviteAccount,
  validateUpdateAccount,
} from "./validation";

function form(entries: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }

  return data;
}

describe("account-management validation", () => {
  it("normalises a valid invitation without accepting a password", () => {
    const result = validateInviteAccount(
      form({
        canManageAccounts: "on",
        committeePosition: "  Secretary  ",
        displayName: "  Fictional Member  ",
        email: "  MEMBER@EXAMPLE.TEST  ",
        role: "authorised",
      }),
    );

    expect(result).toEqual({
      data: {
        canManageAccounts: true,
        committeePosition: "Secretary",
        displayName: "Fictional Member",
        email: "member@example.test",
        role: "authorised",
      },
      ok: true,
    });
    expect(JSON.stringify(result)).not.toContain("password");
  });

  it("returns safe field errors for malformed invitation data", () => {
    const result = validateInviteAccount(
      form({ displayName: "", email: "not-email", role: "administrator" }),
    );

    expect(result).toMatchObject({
      fieldErrors: {
        displayName: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
      },
      ok: false,
    });
  });

  it("requires a trusted UUID for profile and lifecycle mutations", () => {
    expect(validateAccountId(form({ id: "not-a-user" }))).toBeNull();
    expect(
      validateUpdateAccount(
        form({
          displayName: "Fictional Member",
          id: "not-a-user",
          role: "committee",
        }),
      ),
    ).toMatchObject({ fieldErrors: { id: expect.any(String) }, ok: false });
  });
});
