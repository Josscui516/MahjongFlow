import { redirect } from "next/navigation";

// Preserve bookmarked entry links while keeping one dashboard.
export default function BackofficePage() {
  redirect("/dashboard");
}
