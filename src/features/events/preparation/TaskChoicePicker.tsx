"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { TaskStatus } from "@/features/tasks/core/contracts";
import { TASK_STATUS_LABELS, taskDateLabel } from "@/features/tasks/presentation";
import { PreparationSubmitButton } from "./PreparationSubmitButton";
import { taskChoiceReferences, taskMenuPlacement } from "./task-choice-presentation";

export type TaskChoice = Readonly<{ id: string; title: string; dueDate: string; status: TaskStatus }>;

export function TaskChoicePicker({ choices }: Readonly<{ choices: readonly TaskChoice[] }>) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TaskChoice | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [placement, setPlacement] = useState<{ side: "top" | "bottom"; maxHeight: number }>({ side: "bottom", maxHeight: 240 });
  const references = taskChoiceReferences(choices);
  const search = selected ? "" : query.trim().toLocaleLowerCase();
  const matches = choices.filter(choice => choice.title.toLocaleLowerCase().includes(search));

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const height = matches.length === 0 ? 64 : Math.min(240, (listRef.current?.scrollHeight ?? 238) + 2);
      const next = taskMenuPlacement(rect.top, rect.bottom, top, bottom, height);
      setPlacement(current => current.side === next.side && current.maxHeight === next.maxHeight ? current : next);
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open, matches.length, search]);

  function choose(choice: TaskChoice) {
    setSelected(choice); setQuery(references.has(choice.id) ? `${choice.title} · ${references.get(choice.id)}` : choice.title); setOpen(false); setActive(-1);
  }

  function move(index: number) {
    const next = Math.max(0, Math.min(matches.length - 1, index));
    setOpen(true); setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (matches.length) move(event.key === "ArrowDown" ? (open ? active + 1 : 0) : (open && active >= 0 ? active - 1 : matches.length - 1));
      else setOpen(true);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && active >= 0 && matches[active]) choose(matches[active]);
      else if (open && matches.length === 1) choose(matches[0]);
      else setOpen(true);
    } else if (event.key === "Escape") {
      event.preventDefault(); setOpen(false); setActive(-1);
    } else if (event.key === "Tab") setOpen(false);
  }

  return <>
    <div className="relative min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">Add existing task</label>
      <div className="relative">
        <input ref={inputRef} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-choices`} aria-activedescendant={open && active >= 0 && matches[active] ? `${id}-choice-${active}` : undefined} autoComplete="off" placeholder="Search tasks by name…" value={query} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setSelected(null); setActive(-1); setOpen(true); }} onKeyDown={onKeyDown} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-16 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" />
        {query ? <button type="button" aria-label="Clear task selection" className="absolute inset-y-0 right-0 min-h-11 px-3 text-sm font-semibold text-emerald-900 underline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => { setQuery(""); setSelected(null); setActive(-1); setOpen(true); inputRef.current?.focus(); }}>Clear</button> : null}
      {open ? <div data-placement={placement.side} style={{ maxHeight: placement.maxHeight }} className={`absolute z-20 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg ${placement.side === "top" ? "bottom-full mb-1" : "top-full mt-1"}`}>
        <ul ref={listRef} id={`${id}-choices`} role="listbox" aria-label="Matching tasks" className="rounded-lg py-1">
          {matches.map((choice, index) => <li key={choice.id} id={`${id}-choice-${index}`} role="option" aria-selected={selected?.id === choice.id} onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => choose(choice)} className={`min-h-11 cursor-pointer px-3 py-2 text-sm ${active === index ? "bg-emerald-50 text-emerald-950" : "text-slate-900 hover:bg-emerald-50"}`}><span className="block break-words font-medium">{choice.title}</span><span className="mt-0.5 block text-slate-600">{TASK_STATUS_LABELS[choice.status]} · Due {taskDateLabel(choice.dueDate)}{references.has(choice.id) ? ` · ${references.get(choice.id)}` : ""}</span></li>)}
        </ul>
        {matches.length === 0 ? <p role="status" className="px-3 py-4 text-sm text-slate-600">No matching tasks. Try another name.</p> : null}
      </div> : null}
      </div>
      <input type="hidden" name="taskId" value={selected?.id ?? ""} />
    </div>
    <PreparationSubmitButton disabled={!selected} />
  </>;
}
