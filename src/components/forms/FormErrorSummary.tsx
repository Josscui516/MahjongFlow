export type FormErrorItem = Readonly<{
  fieldId: string;
  label: string;
  message: string;
}>;

export type FormErrorSummaryProps = Readonly<{
  errors: readonly FormErrorItem[];
  title?: string;
}>;

export function FormErrorSummary({
  errors,
  title = "Please fix the following fields",
}: FormErrorSummaryProps) {
  const titleId = useId();

  if (errors.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="font-semibold" id={titleId}>
        {title}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              className="font-medium underline decoration-rose-400 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
              href={`#${error.fieldId}`}
            >
              {error.label}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
import { useId } from "react";
