export function taskMenuPlacement(top: number, bottom: number, viewportTop: number, viewportBottom: number, desiredHeight: number) {
  const above = Math.max(0, top - viewportTop - 12);
  const below = Math.max(0, viewportBottom - bottom - 12);
  const side = below >= desiredHeight || below >= above ? "bottom" : "top";
  return { side, maxHeight: Math.min(240, desiredHeight, side === "bottom" ? below : above) } as const;
}

/** Only duplicate names need an additional reference; expand it until unique. */
export function taskChoiceReferences(choices: readonly { id: string; title: string }[]) {
  const groups = new Map<string, string[]>();
  for (const choice of choices) {
    const name = choice.title.trim().toLocaleLowerCase();
    groups.set(name, [...(groups.get(name) ?? []), choice.id]);
  }
  const references = new Map<string, string>();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      const compact = id.replaceAll("-", "");
      let length = Math.min(6, compact.length);
      while (length < compact.length && ids.some(other => other !== id && other.replaceAll("-", "").slice(-length) === compact.slice(-length))) length += 1;
      references.set(id, `Task #${compact.slice(-length)}`);
    }
  }
  return references;
}
