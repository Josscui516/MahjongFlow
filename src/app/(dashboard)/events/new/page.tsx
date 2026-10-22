import { connection } from "next/server";
import Link from "next/link";
import { PageFrame } from "@/components/layout";
import { EventEditor } from "@/features/events/editor/EventEditor";
import { createEventAction, updateEventAction } from "@/features/events/editor/actions";
export default async function NewEventPage() { await connection(); return <PageFrame description="Set up a weekly session or tournament for the club." title="Create event"><div className="mb-5"><Link className="font-semibold text-emerald-900 underline" href="/events">Back to events</Link></div><EventEditor createInstant={new Date().toISOString()} createEventAction={createEventAction} updateEventAction={updateEventAction}/></PageFrame>; }
