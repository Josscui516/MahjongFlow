"use client";

import { useState } from "react";

import type {
  AgendaDraft,
  AgendaSaveResult,
  MeetingAgendaDTO,
} from "./contracts";

type Props = Readonly<{
  agenda: MeetingAgendaDTO;
  onSave: (draft: AgendaDraft) => Promise<AgendaSaveResult>;
}>;

type SectionKey = "discussionPoints" | "decisions";

const labels: Record<SectionKey, string> = {
  discussionPoints: "Discussion points",
  decisions: "Key decisions",
};

export function MeetingAgendaSection({ agenda, onSave }: Props) {
  const [draft, setDraft] = useState<AgendaDraft>({
    discussionPoints: agenda.discussionPoints.map(({ id, content }) => ({
      id,
      content,
    })),
    decisions: agenda.decisions.map(({ id, content }) => ({ id, content })),
  });
  const [result, setResult] = useState<AgendaSaveResult | null>(null);
  const [pending, setPending] = useState(false);

  function updateItem(section: SectionKey, index: number, value: string) {
    setDraft((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, content: value } : item,
      ),
    }));
  }

  function addItem(section: SectionKey) {
    setDraft((current) => ({
      ...current,
      [section]: [...current[section], { content: "" }],
    }));
  }

  function removeUnsavedItem(section: SectionKey, index: number) {
    setDraft((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function submit() {
    setPending(true);
    setResult(null);
    try {
      const nextResult = await onSave(draft);
      setResult(nextResult);
      if (nextResult.ok) {
        setDraft({
          discussionPoints: nextResult.agenda.discussionPoints.map(
            ({ id, content }) => ({ id, content }),
          ),
          decisions: nextResult.agenda.decisions.map(({ id, content }) => ({
            id,
            content,
          })),
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="meeting-agenda-heading">
      <h2 id="meeting-agenda-heading">Meeting agenda</h2>
      {(["discussionPoints", "decisions"] as const).map((section) => (
        <fieldset key={section} disabled={pending}>
          <legend>{labels[section]}</legend>
          {draft[section].length === 0 ? (
            <p>No items added.</p>
          ) : null}
          {draft[section].map((item, index) => {
            const error =
              result && !result.ok && result.code === "validation"
                ? result.fieldErrors.find(
                    (item) => item.section === section && item.index === index,
                  )
                : undefined;
            const inputId = `${section}-${index}`;

            return (
              <div key={inputId}>
                <label htmlFor={inputId}>
                  {labels[section]} {index + 1}
                </label>
                <textarea
                  id={inputId}
                  value={item.content}
                  maxLength={5000}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  onChange={(event) =>
                    updateItem(section, index, event.currentTarget.value)
                  }
                />
                {error ? (
                  <p id={`${inputId}-error`} role="alert">
                    {error.message}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeUnsavedItem(section, index)}
                >
                  Remove before save
                </button>
              </div>
            );
          })}
          <button type="button" onClick={() => addItem(section)}>
            Add {labels[section].toLowerCase()}
          </button>
        </fieldset>
      ))}

      {result?.ok ? (
        <p role="status">Meeting agenda saved.</p>
      ) : result && result.code !== "validation" ? (
        <p role="alert">{result.message}</p>
      ) : null}

      <button type="button" disabled={pending} onClick={submit}>
        {pending ? "Saving…" : "Save meeting agenda"}
      </button>
    </section>
  );
}
