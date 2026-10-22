import { redirect } from "next/navigation";
import { AuthorizationError, requireActiveUser } from "@/lib/auth/authorization";

// Preserve bookmarked entry links while keeping one dashboard.
export default async function BackofficePage() {
  let access;
  try {
    access = await requireActiveUser();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/login");
    throw error;
  }
  redirect(access.canManageAccounts ? "/admin/users" : "/dashboard");
}
