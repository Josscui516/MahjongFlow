"use client";

import type {RelatedTasksResult} from "@/features/tasks/source-navigation/contracts";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AgendaDraft,
  AgendaFieldError,
  AgendaSaveResult,
  MeetingAgendaDTO,
} from "./contracts";
import { saveAgendaSafely } from "./client-submission";
import { TaskConversionEntry } from "./TaskConversionEntry";

type Props = Readonly<{
  agenda: MeetingAgendaDTO;
  startInReadMode?: boolean;
  relatedTasks?: RelatedTasksResult;
  focusOnMount?: boolean;
  onSave: (draft: AgendaDraft) => Promise<AgendaSaveResult>;
}>;

type SectionKey = "discussionPoints" | "decisions";

const MAX_ITEM_LENGTH = 5_000;
const SECTION_KEYS = ["discussionPoints", "decisions"] as const;

const SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const COMPACT_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400";

function draftFromAgenda(agenda: MeetingAgendaDTO): AgendaDraft {
  return {
    decisions: agenda.decisions.map(({ id, content }) => ({ id, content })),
    discussionPoints: agenda.discussionPoints.map(({ id, content }) => ({ id, content })),
  };
}

export function createAgendaFingerprint(draft: AgendaDraft): string {
  return JSON.stringify({
    decisions: draft.decisions.map(({ id, content }) => ({ id: id ?? null, content })),
    discussionPoints: draft.discussionPoints.map(({ id, content }) => ({ id: id ?? null, content })),
  });
}

export function moveAgendaItem(
  draft: AgendaDraft,
  section: SectionKey,
  fromIndex: number,
  toIndex: number,
): AgendaDraft {
  if (fromIndex < 0 || fromIndex >= draft[section].length || toIndex < 0 || toIndex >= draft[section].length || fromIndex === toIndex) return draft;
  const reorderedItems = [...draft[section]];
  const [movedItem] = reorderedItems.splice(fromIndex, 1);
  if (!movedItem) return draft;
  reorderedItems.splice(toIndex, 0, movedItem);
  return { ...draft, [section]: reorderedItems };
}

function AgendaErrorSummary({ errors }: Readonly<{ errors: readonly AgendaFieldError[] }>) {
  if (errors.length === 0) return null;

  return (
    <section aria-labelledby="agenda-error-heading" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-950" role="alert" tabIndex={-1}>
      <h3 className="font-semibold" id="agenda-error-heading">Fix the following agenda items</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {errors.map((error) => (
          <li key={`${error.section}-${error.index}`}>
            <a className="font-medium underline underline-offset-2" href={`#${error.section}-${error.index}`}>
              Agenda item: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MeetingAgendaSection({ agenda, focusOnMount = false, onSave, startInReadMode = false, relatedTasks }: Props) {
  const [editing,setEditing]=useState(!startInReadMode || focusOnMount);
  const [savedDraft,setSavedDraft]=useState(() => draftFromAgenda(agenda));
  const initialFingerprint = useMemo(() => createAgendaFingerprint(draftFromAgenda(agenda)), [agenda]);
  const [draft, setDraft] = useState<AgendaDraft>(() => draftFromAgenda(agenda));
  const [savedFingerprint, setSavedFingerprint] = useState(initialFingerprint);
  const [result, setResult] = useState<AgendaSaveResult | null>(null);
  const [pending, setPending] = useState(false);
  const agendaHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousEditing = useRef(editing);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const pendingFocusId = useRef<string | null>(null);
  const currentFingerprint = createAgendaFingerprint(draft);
  const hasChanges = currentFingerprint !== savedFingerprint;
  const validationErrors = useMemo(
    () => result && !result.ok && result.code === "validation" ? result.fieldErrors : [],
    [result],
  );

  useEffect(() => {
    if (previousEditing.current !== editing) {
      agendaHeadingRef.current?.focus({ preventScroll: true });
      previousEditing.current = editing;
    }
  }, [editing]);

  useEffect(() => {
    if (!focusOnMount) return;
    agendaHeadingRef.current?.focus({ preventScroll: true });
    agendaHeadingRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [focusOnMount]);

  useEffect(() => {
    const inputId = pendingFocusId.current;
    if (!inputId) return;
    pendingFocusId.current = null;
    document.getElementById(inputId)?.focus();
  }, [draft]);

  useEffect(() => {
    if (validationErrors.length > 0) {
      errorSummaryRef.current?.querySelector<HTMLElement>("[tabindex='-1']")?.focus();
    }
  }, [validationErrors]);

  function clearResult() {
    setResult(null);
  }

  function updateItem(section: SectionKey, index: number, value: string) {
    clearResult();
    setDraft((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => itemIndex === index ? { ...item, content: value } : item),
    }));
  }

  function addItem(section: SectionKey) {
    clearResult();
    setEditing(true);
    pendingFocusId.current = `${section}-${draft[section].length}`;
    setDraft((current) => ({ ...current, [section]: [...current[section], { content: "" }] }));
  }

  function removeItem(section: SectionKey, index: number) {
    clearResult();
    setDraft((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function reorderItem(section: SectionKey, fromIndex: number, toIndex: number) {
    clearResult();
    setDraft((current) => moveAgendaItem(current, section, fromIndex, toIndex));
  }

  async function submit() {
    if (!hasChanges) { setEditing(false); return; }
    setPending(true);
    setResult(null);
    try {
      const nextResult = await saveAgendaSafely(onSave, draft);
      setResult(nextResult);
      if (nextResult.ok) {
        const nextDraft = draftFromAgenda(nextResult.agenda);
        setDraft(nextDraft);
        setSavedDraft(nextDraft);
        setEditing(false);
        setSavedFingerprint(createAgendaFingerprint(nextDraft));
      }
    } finally {
      setPending(false);
    }
  }

  const notes = SECTION_KEYS.flatMap(section => draft[section].map((item, index) => ({ item, section, index })));

  if (!editing) return <section aria-labelledby="meeting-agenda-heading">
    <div className="flex items-center justify-between gap-3"><h2 id="meeting-agenda-heading" ref={agendaHeadingRef} tabIndex={-1} className="text-xl font-bold text-slate-950 focus:outline-none">Meeting agenda</h2><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setEditing(true)}>Edit agenda</button></div>
    {result?.ok ? <p role="status" className="mt-3 text-sm text-emerald-800">Meeting agenda saved.</p> : null}
    {notes.length ? (
      <ol className="mt-3 divide-y divide-slate-200">
        {notes.map(({ item, section, index }, noteIndex) => (
          <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-4" key={`${section}-${item.id ?? index}`}>
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-600">{noteIndex + 1}</span>
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{item.content}</p>
            {item.id ? (
              <div className="col-start-2 min-w-0 lg:col-start-3 lg:row-start-1">
                <TaskConversionEntry agendaItemNumber={noteIndex + 1} sourceId={item.id} sourceKind={section === "decisions" ? "decision" : "discussion"} task={relatedTasks?.ok ? relatedTasks.items.find(task => task.sourceId === item.id) : undefined} unavailable={relatedTasks !== undefined && !relatedTasks.ok} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    ) : <p className="mt-3 text-sm text-slate-600">No agenda items yet. Record topics, outcomes, or follow-up actions.</p>}

    <button className={`${SECONDARY_BUTTON_CLASS} mt-3`} onClick={() => addItem("decisions")} type="button">Add agenda</button>
  </section>;

  return (
    <section aria-labelledby="meeting-agenda-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950 focus:outline-none" id="meeting-agenda-heading" ref={agendaHeadingRef} tabIndex={-1}>Meeting agenda</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Record topics, outcomes, and follow-up actions in one place.</p>
        </div>
        <p className={`rounded-full px-3 py-1 text-xs font-semibold ${hasChanges ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-900"}`} role="status">
          {pending ? "Saving…" : hasChanges ? "Unsaved changes" : "No changes to save"}
        </p>
      </div>

      <div className={validationErrors.length ? "mt-4" : undefined} ref={errorSummaryRef}><AgendaErrorSummary errors={validationErrors} /></div>

      <fieldset className="mt-4 space-y-3" disabled={pending}>
        <legend className="sr-only">Meeting agenda</legend>
        {notes.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No agenda items yet. Add a topic, outcome, or follow-up action.</p> : null}
        {notes.map(({ item, section, index }, noteIndex) => {
          const error = validationErrors.find(value => value.section === section && value.index === index);
          const inputId = `${section}-${index}`;
          return <div className="rounded-xl bg-slate-50 p-3" key={item.id ?? inputId}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-semibold text-slate-900" htmlFor={inputId}>Agenda item {noteIndex + 1}</label>
              <div className="flex flex-wrap gap-2">
                {draft[section].length > 1 ? <>
                  <button aria-label={`Move agenda item ${noteIndex + 1} up`} className={COMPACT_BUTTON_CLASS} disabled={index === 0} onClick={() => reorderItem(section,index,index-1)} type="button">Move up</button>
                  <button aria-label={`Move agenda item ${noteIndex + 1} down`} className={COMPACT_BUTTON_CLASS} disabled={index === draft[section].length-1} onClick={() => reorderItem(section,index,index+1)} type="button">Move down</button>
                </> : null}
                <button aria-label={`Remove agenda item ${noteIndex + 1}`} className={`${COMPACT_BUTTON_CLASS} border-rose-200 text-rose-800`} onClick={() => removeItem(section,index)} type="button">Remove agenda item</button>
              </div>
            </div>
            <textarea aria-describedby={error ? `${inputId}-error ${inputId}-counter` : `${inputId}-counter`} aria-invalid={Boolean(error)} className="mt-2 min-h-20 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 aria-[invalid=true]:border-rose-700" id={inputId} maxLength={MAX_ITEM_LENGTH} placeholder="e.g. Book Club Room A and prepare four sets of tiles for the next session." onChange={event => updateItem(section,index,event.currentTarget.value)} value={item.content} />
            {error ? <p className="mt-1 text-sm text-rose-800" id={`${inputId}-error`}>Error: {error.message}</p> : null}
            <p className="mt-1 text-right text-xs tabular-nums text-slate-500" id={`${inputId}-counter`}>{item.content.length.toLocaleString("en-AU")} / 5,000</p>

          </div>;
        })}
        <button className={SECONDARY_BUTTON_CLASS} onClick={() => addItem("decisions")} type="button">Add agenda</button>
      </fieldset>

      {result?.ok ? (
        <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">Meeting agenda saved.</p>
      ) : result && result.code !== "validation" ? (
        <p className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-950" role="alert">{result.message}</p>
      ) : null}

      <div className="sticky bottom-0 z-10 mt-4 flex flex-col items-stretch gap-3 border-t border-slate-200 bg-white py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{hasChanges ? "Save to apply additions, removals, and ordering changes." : "No changes to save."}</p>
        <div className="flex flex-wrap gap-2">
        {hasChanges ? <button type="button" className={SECONDARY_BUTTON_CLASS} disabled={pending} onClick={() => {setDraft(savedDraft); setResult(null); setEditing(false);}}>Discard changes</button> : null}
        <button aria-busy={pending || undefined} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-800" disabled={pending} onClick={submit} type="button">
          {pending ? "Saving…" : hasChanges ? "Save and close" : "Done"}
        </button>
        </div>
      </div>
    </section>
  );
}
