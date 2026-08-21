import { describe, expect, test, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => navigationMocks);

import HomePage from "@/app/page";

describe("home page", () => {
  test("uses the existing login page as the application entry point", () => {
    expect(() => HomePage()).toThrow("NEXT_REDIRECT");
    expect(navigationMocks.redirect).toHaveBeenCalledWith("/login");
  });
});
