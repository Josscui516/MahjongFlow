import Link from "next/link";
import { notFound } from "next/navigation";
import { SystemErrorFeedback } from "@/components/feedback";
import { PageFrame } from "@/components/layout";
import { getEvent } from "@/features/events/core/service";
import { EventEditor } from "@/features/events/editor/EventEditor";
import { createEventAction, updateEventAction } from "@/features/events/editor/actions";
export default async function EditEventPage({ params }: Readonly<{ params: Promise<{ eventId: string }> }>) { const { eventId } = await params; const result = await getEvent(eventId); if (!result.ok) { if (result.code === "NOT_FOUND") notFound(); return <SystemErrorFeedback/>; } return <PageFrame description="Update event details without replacing its identity or relationships." title="Edit event"><div className="mb-5"><Link className="font-semibold text-emerald-900 underline" href={`/events/${eventId}`}>Back to event</Link></div><EventEditor createEventAction={createEventAction} initialRecord={result.record} updateEventAction={updateEventAction}/></PageFrame>; }
