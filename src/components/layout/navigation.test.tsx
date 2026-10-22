import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppNavigation } from "./AppNavigation";
import {
  getNavigationSections,
  isNavigationItemCurrent,
} from "./navigation";

describe("role-aware navigation", () => {
  it("hides registrations and dinner roster for both roles and administrator capabilities", () => {
    for (const role of ["committee", "authorised"] as const) for (const administrator of [false,true]) {
      const hrefs = getNavigationSections(role, administrator).flatMap(section => section.items.map(item => item.href));
      expect(hrefs).not.toContain("/registrations");
      expect(hrefs).not.toContain("/dinner-roster");
    }
  });
  it("keeps section identities unique and stable across roles and capabilities", () => {
    for (const role of ["committee", "authorised"] as const) {
      for (const canManageAccounts of [false, true]) {
        const sections = getNavigationSections(role, canManageAccounts);
        const ids = sections.map((section) => section.id);
        expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
        expect(sections[0].id).toBe("primary");
        if (canManageAccounts) {
          expect(sections.find((section) => section.items.some((item) => item.href === "/admin/users"))?.id).toBe("primary");
        }
      }
    }
  });

  it("returns primary destinations for committee members", () => {
    expect(getNavigationSections("committee")).toEqual([
      {
        id: "primary",
        items: [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/meetings", label: "Meetings" },
          { href: "/tasks", label: "Tasks" },
          { href: "/events", label: "Events" },
        ],
      },
    ]);
  });

  it("returns primary destinations for authorised members", () => {
    expect(getNavigationSections("authorised")).toEqual([
      {
        id: "primary",
        items: [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/meetings", label: "Meetings" },
          { href: "/tasks", label: "Tasks" },
          { href: "/events", label: "Events" },
        ],
      },
    ]);
  });

  it("adds account administration independently from the data role", () => {
    expect(getNavigationSections("committee", true)).toContainEqual({
      id: "primary",
      items: [{ href: "/admin/users", label: "Accounts" }],
    });
    expect(getNavigationSections("authorised", false)).not.toContainEqual({
      id: "primary",
      items: [{ href: "/admin/users", label: "Accounts" }],
    });
  });

  it("never exposes context-only attendance or dinner destinations", () => {
    const allNavigation = JSON.stringify([
      ...getNavigationSections("committee"),
      ...getNavigationSections("authorised"),
    ]);

    expect(allNavigation).not.toContain("/attendance");
    expect(allNavigation).not.toContain("/dinner-verification");
  });

  it("marks exact and nested module routes as current", () => {
    expect(isNavigationItemCurrent("/tasks", "/tasks")).toBe(true);
    expect(isNavigationItemCurrent("/tasks", "/tasks/fictional-task")).toBe(
      true,
    );
    expect(isNavigationItemCurrent("/tasks", "/events")).toBe(false);
    expect(isNavigationItemCurrent("/tasks")).toBe(false);
  });

  it("renders keyboard-native mobile navigation and the current route", () => {
    const html = renderToStaticMarkup(
      <AppNavigation currentPath="/tasks/fictional-task" role="authorised" />,
    );

    expect(html).toContain('<nav aria-label="Desktop navigation"');
    expect(html).toContain('<nav aria-label="Mobile navigation"');
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toMatch(
      /<a(?=[^>]*aria-current="page")(?=[^>]*href="\/tasks")[^>]*>Tasks<\/a>/,
    );
    expect(html).not.toContain("Sensitive operations");
    expect(html).not.toContain('href="/registrations"');
    expect(html).not.toContain('href="/dinner-roster"');

    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => !/\s/.test(id))).toBe(true);
  });

  it("does not render unfinished navigation for committee members", () => {
    const html = renderToStaticMarkup(
      <AppNavigation role="committee" />,
    );

    expect(html).not.toContain("Sensitive operations");
    expect(html).not.toContain('href="/registrations"');
    expect(html).not.toContain('href="/dinner-roster"');
    expect(html).toContain('href="/dashboard"');
    expect(html).not.toContain('href="/backoffice"');
    expect(html).toContain('href="/meetings"');
    expect(html).toContain('href="/tasks"');
    expect(html).toContain('href="/events"');
  });
});
