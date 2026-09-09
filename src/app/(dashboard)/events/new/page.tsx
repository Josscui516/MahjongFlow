import Link from "next/link";
import { PageFrame } from "@/components/layout";
import { EventEditor } from "@/features/events/editor/EventEditor";
import { createEventAction, updateEventAction } from "@/features/events/editor/actions";
export default function NewEventPage() { return <PageFrame description="Record a validated weekly session or tournament." title="Create event"><div className="mb-5"><Link className="font-semibold text-emerald-900 underline" href="/events">Back to events</Link></div><EventEditor createEventAction={createEventAction} updateEventAction={updateEventAction}/></PageFrame>; }
