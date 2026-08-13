"use server";

import { redirect } from "next/navigation";

import {
  AUTH_ERROR_CODES,
  type LoginActionState,
  type LoginErrorCode,
  type LogoutActionState,
} from "@/lib/auth/contracts";
import {
  mapPasswordSignInError,
  parseLoginCredentials,
} from "@/lib/auth/credentials";
import { getSafeBackofficeRedirectPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  void _previousState;

  const credentials = parseLoginCredentials(
    formData.get("email"),
    formData.get("password"),
  );

  if (!credentials) {
    return { error: AUTH_ERROR_CODES.INVALID_CREDENTIALS };
  }

  const destination = getSafeBackofficeRedirectPath(formData.get("next"));
  let errorCode: LoginErrorCode | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      errorCode = mapPasswordSignInError(error);
    } else if (!data.session || !data.user) {
      errorCode = AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
    }
  } catch {
    errorCode = AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
  }

  if (errorCode) {
    return { error: errorCode };
  }

  redirect(destination);
}

export async function logoutAction(
  _previousState: LogoutActionState,
): Promise<LogoutActionState> {
  void _previousState;

  const authentication = await getAuthenticatedUser();

  if (!authentication.ok) {
    if (authentication.error === AUTH_ERROR_CODES.SERVICE_UNAVAILABLE) {
      return { error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE };
    }

    redirect("/login");
  }

  let failed = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    failed = error !== null;
  } catch {
    failed = true;
  }

  if (failed) {
    return { error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE };
  }

  redirect("/login");
}
