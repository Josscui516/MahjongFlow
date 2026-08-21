import type { BackendRole } from "@/lib/auth/authorization";

export type ManagedAccountStatus = "active" | "disabled" | "invited";

export type ManagedAccount = Readonly<{
  canManageAccounts: boolean;
  committeePosition: string | null;
  displayName: string;
  email: string;
  id: string;
  isCurrentUser: boolean;
  role: BackendRole;
  status: ManagedAccountStatus;
}>;

export type AccountActionState = Readonly<{
  fieldErrors?: Readonly<Record<string, string>>;
  message: string;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_ACCOUNT_ACTION_STATE: AccountActionState = {
  message: "",
  status: "idle",
};

export type InviteAccountInput = Readonly<{
  canManageAccounts: boolean;
  committeePosition: string | null;
  displayName: string;
  email: string;
  role: BackendRole;
}>;

export type UpdateAccountInput = Readonly<{
  canManageAccounts: boolean;
  committeePosition: string | null;
  displayName: string;
  id: string;
  role: BackendRole;
}>;
