"use server";

import { revalidatePath } from "next/cache";

import type { AccountActionState } from "./contracts";
import {
  AccountManagementError,
  getAccountManagementService,
} from "./service";
import {
  validateAccountId,
  validateInviteAccount,
  validateUpdateAccount,
} from "./validation";

function actionError(error: unknown): AccountActionState {
  if (error instanceof AccountManagementError) {
    if (error.code === "DUPLICATE_EMAIL") {
      return {
        fieldErrors: { email: "An account already uses this email address." },
        message: "The invitation was not sent.",
        status: "error",
      };
    }

    if (error.code === "CONFLICT") {
      return {
        message:
          "This change would remove the final active account administrator or conflicts with the current account state.",
        status: "error",
      };
    }

    if (error.code === "FORBIDDEN") {
      return {
        message: "You no longer have permission to manage accounts.",
        status: "error",
      };
    }

    if (error.code === "MISSING") {
      return {
        message: "The selected account is no longer available.",
        status: "error",
      };
    }
  }

  return {
    message:
      "We could not confirm the complete change. Refresh the account list before trying again.",
    status: "error",
  };
}

export async function inviteAccountAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validation = validateInviteAccount(formData);

  if (!validation.ok) {
    return {
      fieldErrors: validation.fieldErrors,
      message: "Review the highlighted fields.",
      status: "error",
    };
  }

  try {
    const service = await getAccountManagementService();
    await service.inviteAccount(validation.data);
    revalidatePath("/admin/users");

    return {
      message: "Invitation sent and the committee profile was created.",
      status: "success",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAccountAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validation = validateUpdateAccount(formData);

  if (!validation.ok) {
    return {
      fieldErrors: validation.fieldErrors,
      message: "Review the highlighted fields.",
      status: "error",
    };
  }

  try {
    const service = await getAccountManagementService();
    await service.updateAccount(validation.data);
    revalidatePath("/admin/users");

    return { message: "Account details updated.", status: "success" };
  } catch (error) {
    return actionError(error);
  }
}

export async function setAccountActiveAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const id = validateAccountId(formData);
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { message: "The selected account is unavailable.", status: "error" };
  }

  try {
    const service = await getAccountManagementService();
    await service.setAccountActive(id, isActive);
    revalidatePath("/admin/users");

    return {
      message: isActive ? "Account reactivated." : "Account disabled.",
      status: "success",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function sendRecoveryAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const id = validateAccountId(formData);

  if (!id) {
    return { message: "The selected account is unavailable.", status: "error" };
  }

  try {
    const service = await getAccountManagementService();
    await service.sendRecovery(id);

    return {
      message: "Password recovery email sent.",
      status: "success",
    };
  } catch (error) {
    return actionError(error);
  }
}
