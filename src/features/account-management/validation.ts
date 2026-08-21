import type {
  InviteAccountInput,
  UpdateAccountInput,
} from "./contracts";
import type { BackendRole } from "@/lib/auth/authorization";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidationResult<T> =
  | Readonly<{ data: T; ok: true }>
  | Readonly<{
      fieldErrors: Readonly<Record<string, string>>;
      ok: false;
    }>;

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readRole(formData: FormData): BackendRole | null {
  const value = readString(formData, "role");
  return value === "committee" || value === "authorised" ? value : null;
}

function validateCommonFields(formData: FormData) {
  const displayName = readString(formData, "displayName");
  const committeePosition = readString(formData, "committeePosition") || null;
  const role = readRole(formData);
  const fieldErrors: Record<string, string> = {};

  if (displayName.length < 1 || displayName.length > 120) {
    fieldErrors.displayName = "Enter a display name between 1 and 120 characters.";
  }

  if (committeePosition && committeePosition.length > 80) {
    fieldErrors.committeePosition = "Keep the committee position to 80 characters or fewer.";
  }

  if (!role) {
    fieldErrors.role = "Choose a valid access role.";
  }

  return {
    canManageAccounts: formData.get("canManageAccounts") === "on",
    committeePosition,
    displayName,
    fieldErrors,
    role,
  };
}

export function validateInviteAccount(
  formData: FormData,
): ValidationResult<InviteAccountInput> {
  const common = validateCommonFields(formData);
  const email = readString(formData, "email").toLowerCase();
  const fieldErrors = { ...common.fieldErrors };

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!common.role || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, ok: false };
  }

  return {
    data: {
      canManageAccounts: common.canManageAccounts,
      committeePosition: common.committeePosition,
      displayName: common.displayName,
      email,
      role: common.role,
    },
    ok: true,
  };
}

export function validateUpdateAccount(
  formData: FormData,
): ValidationResult<UpdateAccountInput> {
  const common = validateCommonFields(formData);
  const id = readString(formData, "id");
  const fieldErrors = { ...common.fieldErrors };

  if (!UUID_PATTERN.test(id)) {
    fieldErrors.id = "The selected account is unavailable.";
  }

  if (!common.role || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, ok: false };
  }

  return {
    data: {
      canManageAccounts: common.canManageAccounts,
      committeePosition: common.committeePosition,
      displayName: common.displayName,
      id,
      role: common.role,
    },
    ok: true,
  };
}

export function validateAccountId(formData: FormData) {
  const id = readString(formData, "id");

  return UUID_PATTERN.test(id) ? id : null;
}
