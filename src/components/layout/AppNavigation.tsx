import Link from "next/link";
import type {ReactNode} from "react";

import {
  getNavigationSections,
  isNavigationItemCurrent,
  type BackofficeRole,
} from "./navigation";

export type AppNavigationProps = Readonly<{
  accountSlot?: ReactNode;
  canManageAccounts?: boolean;
  currentPath?: string;
  role: BackofficeRole;
}>;

type NavigationLinksProps = AppNavigationProps &
  Readonly<{
    ariaLabel: string;
    idPrefix: string;
  }>;

function NavigationLinks({
  ariaLabel,
  canManageAccounts,
  currentPath,
  idPrefix,
  role,
}: NavigationLinksProps) {
  const sections = getNavigationSections(role, canManageAccounts);

  return (
    <nav aria-label={ariaLabel} className="space-y-7">
      {sections.map((section) => (
        <div
          aria-labelledby={
            section.label ? `${idPrefix}-section-${section.id}` : undefined
          }
          key={section.id}
          role={section.label ? "group" : undefined}
        >
          {section.label ? (
            <h2
              className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
              id={`${idPrefix}-section-${section.id}`}
            >
              {section.label}
            </h2>
          ) : null}

          <ul className="space-y-1">
            {section.items.map((item) => {
              const isCurrent = isNavigationItemCurrent(
                item.href,
                currentPath,
              );

              return (
                <li key={item.href}>
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    className={
                      isCurrent
                        ? "flex min-h-11 items-center rounded-xl bg-emerald-950 px-3 py-2.5 text-sm font-semibold text-white shadow-sm"
                        : "flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    }
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppNavigation({
  accountSlot,
  canManageAccounts,
  currentPath,
  role,
}: AppNavigationProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white px-5 py-7 md:block">
        <Link
          className="mb-10 block rounded-lg px-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          href="/dashboard"
        >
          <span className="block text-xl font-bold tracking-tight text-emerald-950">
            MahjongFlow
          </span>
          <span className="mt-1 block text-xs font-medium text-slate-500">
            Committee coordination
          </span>
        </Link>

        <NavigationLinks
          ariaLabel="Desktop navigation"
          canManageAccounts={canManageAccounts}
          currentPath={currentPath}
          idPrefix="desktop-navigation"
          role={role}
        />
      </aside>

      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            className="rounded-lg font-bold tracking-tight text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            href="/dashboard"
          >
            MahjongFlow
          </Link>

          <details className="group relative">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              Menu
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <NavigationLinks
                ariaLabel="Mobile navigation"
                canManageAccounts={canManageAccounts}
                currentPath={currentPath}
                idPrefix="mobile-navigation"
                role={role}
              />
              {accountSlot ? <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 text-sm">{accountSlot}</div> : null}
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
