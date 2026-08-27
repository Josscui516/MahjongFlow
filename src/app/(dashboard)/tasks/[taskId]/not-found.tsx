import Link from "next/link";

import { EmptyFeedback } from "@/components/feedback";

export default function TaskNotFound() {
  return <EmptyFeedback action={<Link className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href="/tasks">Return to tasks</Link>} description="The task may have been removed, or the link may be incorrect." title="Task not found" />;
}
