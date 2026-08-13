import type { ButtonHTMLAttributes, ReactNode } from "react";

export type SubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-busy" | "aria-disabled" | "type"
> &
  Readonly<{
    children: ReactNode;
    pending: boolean;
    pendingLabel?: ReactNode;
  }>;

/**
 * Prevents repeated browser submissions while a request is pending. Server
 * actions and database writes must still enforce their own idempotency.
 */
export function SubmitButton({
  children,
  className,
  disabled = false,
  pending,
  pendingLabel = "Submitting…",
  ...buttonProps
}: SubmitButtonProps) {
  const isDisabled = disabled || pending;

  return (
    <button
      {...buttonProps}
      aria-busy={pending || undefined}
      aria-disabled={isDisabled || undefined}
      className={
        className ??
        "inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      }
      data-submit-state={pending ? "pending" : "idle"}
      disabled={isDisabled}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
