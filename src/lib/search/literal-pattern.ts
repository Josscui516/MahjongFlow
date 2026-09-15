/** Escape user text as a literal PostgreSQL regular expression, never executable syntax. */
export function literalPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
