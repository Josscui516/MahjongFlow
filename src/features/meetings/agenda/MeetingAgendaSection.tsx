"use client";

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
  focusOnMount?: boolean;
  onSave: (draft: AgendaDraft) => Promise<AgendaSaveResult>;
}>;

type SectionKey = "discussionPoints" | "decisions";

const MAX_ITEM_LENGTH = 5_000;
const SECTION_KEYS = ["discussionPoints", "decisions"] as const;
const SECTION_CONTENT: Record<SectionKey, Readonly<{
  addLabel: string;
  emptyDescription: string;
  label: string;
}>> = {
  discussionPoints: {
    addLabel: "Add discussion point",
    emptyDescription: "Capture topics, questions, or updates discussed by the committee.",
    label: "Discussion points",
  },
  decisions: {
    addLabel: "Add key decision",
    emptyDescription: "Record agreed outcomes that the committee needs to remember or act on.",
    label: "Key decisions",
  },
};

const SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const COMPACT_BUTTON_CLASS =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400";

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
              {SECTION_CONTENT[error.section].label} {error.index + 1}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MeetingAgendaSection({ agenda, focusOnMount = false, onSave }: Props) {
  const initialFingerprint = useMemo(() => createAgendaFingerprint(draftFromAgenda(agenda)), [agenda]);
  const [draft, setDraft] = useState<AgendaDraft>(() => draftFromAgenda(agenda));
  const [savedFingerprint, setSavedFingerprint] = useState(initialFingerprint);
  const [result, setResult] = useState<AgendaSaveResult | null>(null);
  const [pending, setPending] = useState(false);
  const agendaHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const pendingFocusId = useRef<string | null>(null);
  const currentFingerprint = createAgendaFingerprint(draft);
  const hasChanges = currentFingerprint !== savedFingerprint;
  const validationErrors = useMemo(
    () => result && !result.ok && result.code === "validation" ? result.fieldErrors : [],
    [result],
  );

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
    if (!hasChanges) return;
    setPending(true);
    setResult(null);
    try {
      const nextResult = await saveAgendaSafely(onSave, draft);
      setResult(nextResult);
      if (nextResult.ok) {
        const nextDraft = draftFromAgenda(nextResult.agenda);
        setDraft(nextDraft);
        setSavedFingerprint(createAgendaFingerprint(nextDraft));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="meeting-agenda-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950 focus:outline-none" id="meeting-agenda-heading" ref={agendaHeadingRef} tabIndex={-1}>Meeting agenda</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Keep discussion topics and agreed decisions in the order they occurred.</p>
        </div>
        <p className={`rounded-full px-3 py-1 text-xs font-semibold ${hasChanges ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-900"}`} role="status">
          {hasChanges ? "Unsaved changes" : "Saved"}
        </p>
      </div>

      <div className="mt-5" ref={errorSummaryRef}><AgendaErrorSummary errors={validationErrors} /></div>

      <div className="mt-6 space-y-7">
        {SECTION_KEYS.map((section) => {
          const content = SECTION_CONTENT[section];
          return (
            <fieldset className="border-t border-slate-200 pt-5" disabled={pending} key={section}>
              <legend className="px-0 text-base font-semibold text-slate-950">{content.label}</legend>
              {draft[section].length === 0 ? (
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-600">{content.emptyDescription}</p>
                  <button className={`${SECONDARY_BUTTON_CLASS} mt-3`} onClick={() => addItem(section)} type="button">
                    {section === "discussionPoints" ? "Add first discussion point" : "Add first key decision"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {draft[section].map((item, index) => {
                    const error = validationErrors.find((validationError) => validationError.section === section && validationError.index === index);
                    const inputId = `${section}-${index}`;

                    return (
                      <div className="rounded-xl bg-slate-50 p-4" key={item.id ?? inputId}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="text-sm font-semibold text-slate-900" htmlFor={inputId}>{content.label} {index + 1}</label>
                          <div className="flex flex-wrap gap-2">
                            <button aria-label={`Move ${content.label.toLowerCase()} ${index + 1} up`} className={COMPACT_BUTTON_CLASS} disabled={index === 0} onClick={() => reorderItem(section, index, index - 1)} type="button">Move up</button>
                            <button aria-label={`Move ${content.label.toLowerCase()} ${index + 1} down`} className={COMPACT_BUTTON_CLASS} disabled={index === draft[section].length - 1} onClick={() => reorderItem(section, index, index + 1)} type="button">Move down</button>
                            <button aria-label={`Remove ${content.label.toLowerCase()} ${index + 1}`} className={`${COMPACT_BUTTON_CLASS} border-rose-200 text-rose-800 hover:border-rose-300 hover:bg-rose-50`} onClick={() => removeItem(section, index)} type="button">Remove item</button>
                            {item.id ? (
                              <TaskConversionEntry
                                sourceId={item.id}
                                sourceKind={section === "decisions" ? "decision" : "discussion"}
                              />
                            ) : null}
                          </div>
                        </div>
                        <textarea
                          aria-describedby={error ? `${inputId}-error ${inputId}-counter` : `${inputId}-counter`}
                          aria-invalid={Boolean(error)}
                          className="mt-3 min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 aria-[invalid=true]:border-rose-700 aria-[invalid=true]:ring-rose-100"
                          id={inputId}
                          maxLength={MAX_ITEM_LENGTH}
                          onChange={(event) => updateItem(section, index, event.currentTarget.value)}
                          value={item.content}
                        />
                        <div className="mt-1 flex items-start justify-between gap-3 text-xs">
                          <div>
                            {error ? <p className="text-rose-800" id={`${inputId}-error`}><span className="font-semibold">Error:</span> {error.message}</p> : null}
                            {item.id ? <p className="text-slate-500">Removing this item is applied when you save the agenda.</p> : null}
                          </div>
                          <p className="shrink-0 tabular-nums text-slate-500" id={`${inputId}-counter`}>{item.content.length.toLocaleString("en-AU")} / 5,000</p>
                        </div>
                      </div>
                    );
                  })}
                  <button className={SECONDARY_BUTTON_CLASS} onClick={() => addItem(section)} type="button">{content.addLabel}</button>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      {result?.ok ? (
        <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">Meeting agenda saved.</p>
      ) : result && result.code !== "validation" ? (
        <p className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-950" role="alert">{result.message}</p>
      ) : null}

      <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{hasChanges ? "Save to apply additions, removals, and ordering changes." : "All agenda changes are saved."}</p>
        <button aria-busy={pending || undefined} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-800" disabled={pending || !hasChanges} onClick={submit} type="button">
          {pending ? "Saving…" : "Save agenda"}
        </button>
      </div>
    </section>
  );
}
