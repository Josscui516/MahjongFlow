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

const SHARED_NAVIGATION_SECTION = {
  items: SHARED_NAVIGATION_ITEMS,
} as const satisfies NavigationSection;

const ACCOUNT_ADMINISTRATION_SECTION = {
  label: "Administration",
  items: [{ href: "/admin/users", label: "Accounts" }],
} as const satisfies NavigationSection;

/**
 * Returns navigation visibility for a role that has already been verified on
 * the server. This controls presentation only; it is not an authorisation
 * boundary and must be paired with route checks and RLS.
 */
export function getNavigationSections(
  role: BackofficeRole,
  canManageAccounts = false,
): readonly NavigationSection[] {
  const sections: NavigationSection[] = [SHARED_NAVIGATION_SECTION];

  if (role === "authorised") sections.push({ items: [{ href: "/registrations", label: "Registrations" }] });

  if (canManageAccounts) {
    sections.push(ACCOUNT_ADMINISTRATION_SECTION);
  }

  return sections;
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
