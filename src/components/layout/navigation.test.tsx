import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppNavigation } from "./AppNavigation";
import {
  getNavigationSections,
  isNavigationItemCurrent,
} from "./navigation";

describe("role-aware navigation", () => {
  it("returns only shared destinations for committee members", () => {
    expect(getNavigationSections("committee")).toEqual([
      {
        items: [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/meetings", label: "Meetings" },
          { href: "/tasks", label: "Tasks" },
          { href: "/events", label: "Events" },
        ],
      },
    ]);
  });

  it("adds only the registrations group for authorised members", () => {
    expect(getNavigationSections("authorised")).toEqual([
      {
        items: [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/meetings", label: "Meetings" },
          { href: "/tasks", label: "Tasks" },
          { href: "/events", label: "Events" },
        ],
      },
      {
        label: "Sensitive operations",
        items: [{ href: "/registrations", label: "Registrations" }],
      },
    ]);
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
    expect(html).toContain("Sensitive operations");
    expect(html).toContain('href="/registrations"');

    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => !/\s/.test(id))).toBe(true);
  });

  it("does not render sensitive navigation for committee members", () => {
    const html = renderToStaticMarkup(
      <AppNavigation role="committee" />,
    );

    expect(html).not.toContain("Sensitive operations");
    expect(html).not.toContain('href="/registrations"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/meetings"');
    expect(html).toContain('href="/tasks"');
    expect(html).toContain('href="/events"');
  });
});
