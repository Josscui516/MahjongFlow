import Link from "next/link";
import {TaskCompleteButton} from "@/features/tasks/TaskCompleteButton";
import {classifyTaskDueRisk} from "@/features/tasks/due-risk";
import {DueRiskReminder} from "@/features/tasks/reminders";
import {taskListReturn,taskDetailHref} from "@/features/tasks/list/return-context";
import {TASK_STATUS_LABELS as STATUS_LABELS, taskDateLabel} from "@/features/tasks/presentation";
import { notFound } from "next/navigation";

import { SuccessFeedback, SystemErrorFeedback } from "@/components/feedback";
import { getTask } from "@/features/tasks/core/service";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
import { SourceTraceabilityPanel } from "@/features/tasks/source-navigation/SourceTraceabilityPanel";
import { readTaskSource } from "@/features/tasks/source-navigation/service";
import { TaskDeleteButton } from "@/features/tasks/TaskDeleteButton";


export default async function TaskPage({ params, searchParams }: Readonly<{ params: Promise<{ taskId: string }>; searchParams: Promise<{ created?: string; saved?: string; returnTo?: string }> }>) {
  const [{ taskId }, query] = await Promise.all([params, searchParams]);
  const result = await getTask(taskId);
  if (!result.ok) { if (result.code === "NOT_FOUND") notFound(); return <SystemErrorFeedback />; }

  const task = result.record;
  const returnTo=taskListReturn(query.returnTo);
  const now=new Date();
  const [assignees, sourceResult] = await Promise.all([listAssigneeOptions(), readTaskSource(task)]);
  const assigneeName = assignees.find((assignee) => assignee.id === task.assigneeId)?.label ?? "Unavailable committee member";

  const otherMeetings = task.relatedMeetings?.filter(meeting => !sourceResult.ok || !sourceResult.source || meeting.id !== sourceResult.source.meetingId) ?? [];

  return (
    <div className="space-y-5">
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4" href={returnTo}>Back to tasks</Link>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0"><h1 className="break-words text-3xl font-bold tracking-tight text-slate-950">{task.title}</h1><p className="mt-2 text-sm text-slate-600">Review task progress, ownership, and the original meeting agenda.</p></div>
        <div className="shrink-0"><div className="flex flex-wrap gap-3">{task.status !== "completed" ? <TaskCompleteButton taskId={task.id} /> : <span role="status" className="self-center font-semibold text-emerald-800">Task completed</span>}<Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={taskDetailHref(task.id,returnTo,true)}>Edit task</Link><TaskDeleteButton direct hasSource={Boolean(task.sourceMeetingId)} successHref={`${returnTo}${returnTo.includes("?") ? "&" : "?"}deleted=1`} taskId={task.id} taskTitle={task.title} /></div></div>
      </header>
      {query.created === "1" ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">Task created successfully.</p> : null}
      {query.saved === "1" ? <SuccessFeedback message="The latest task details are now available to the committee." title="Task saved" /> : null}
      <dl className="grid gap-x-8 gap-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3 sm:p-6">

        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Assignee</dt><dd className="mt-2 font-semibold text-slate-950">{assigneeName}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Due date</dt><dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-slate-950 [&>[data-due-risk]]:mt-0"><time dateTime={task.dueDate}>{taskDateLabel(task.dueDate)}</time><DueRiskReminder compact risk={classifyTaskDueRisk({...task,now})} taskTitle={task.title} dueDate={task.dueDate} now={now} /></dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</dt><dd className="mt-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">{STATUS_LABELS[task.status]}</span></dd></div>
        <div className="sm:col-span-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</dt><dd className="mt-2 whitespace-pre-wrap break-words leading-7 text-slate-800">{task.description}</dd></div>
      </dl>
      {sourceResult.ok && !sourceResult.source ? <p className="text-sm text-slate-600">Source: Direct task</p> : <SourceTraceabilityPanel result={sourceResult} />}
      {otherMeetings.length ? <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="related-meetings-title">
        <h2 id="related-meetings-title" className="text-lg font-semibold text-slate-950">Other related meetings</h2>
        <ul className="mt-3 space-y-2">{otherMeetings.map(meeting => <li key={meeting.id}><Link href={`/meetings/${encodeURIComponent(meeting.id)}`} className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline underline-offset-4">{meeting.title}</Link></li>)}</ul>
      </section> : null}
    </div>
  );
}
