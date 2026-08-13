export type BackofficeRole = "committee" | "authorised";

export type NavigationItem = Readonly<{
  href: string;
  label: string;
}>;

export type NavigationSection = Readonly<{
  label?: string;
  items: readonly NavigationItem[];
}>;

const SHARED_NAVIGATION_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/meetings", label: "Meetings" },
  { href: "/tasks", label: "Tasks" },
  { href: "/events", label: "Events" },
] as const satisfies readonly NavigationItem[];

const SENSITIVE_NAVIGATION_SECTION = {
  label: "Sensitive operations",
  items: [{ href: "/registrations", label: "Registrations" }],
} as const satisfies NavigationSection;

const SHARED_NAVIGATION_SECTION = {
  items: SHARED_NAVIGATION_ITEMS,
} as const satisfies NavigationSection;

/**
 * Returns navigation visibility for a role that has already been verified on
 * the server. This controls presentation only; it is not an authorisation
 * boundary and must be paired with route checks and RLS.
 */
export function getNavigationSections(
  role: BackofficeRole,
): readonly NavigationSection[] {
  if (role === "authorised") {
    return [SHARED_NAVIGATION_SECTION, SENSITIVE_NAVIGATION_SECTION];
  }

  return [SHARED_NAVIGATION_SECTION];
}

export function isNavigationItemCurrent(
  href: string,
  currentPath?: string,
): boolean {
  if (!currentPath) {
    return false;
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}
