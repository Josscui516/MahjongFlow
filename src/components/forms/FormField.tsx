import {
  cloneElement,
  type AriaAttributes,
  type ReactElement,
} from "react";

export type FormControlProps = Readonly<{
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  className?: string;
  id?: string;
  required?: boolean;
}>;

export type FormFieldProps = Readonly<{
  control: ReactElement<FormControlProps>;
  description?: string;
  error?: string | null;
  id: string;
  label: string;
  required?: boolean;
}>;

function joinIds(...values: Array<string | undefined>): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter((value, index, allValues) => value && allValues.indexOf(value) === index);

  return ids.length > 0 ? ids.join(" ") : undefined;
}

const CONTROL_CLASS_NAME =
  "block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 aria-[invalid=true]:border-rose-700 aria-[invalid=true]:ring-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function FormField({
  control,
  description,
  error,
  id,
  label,
  required = false,
}: FormFieldProps) {
  const isRequired = required || control.props.required;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = joinIds(
    control.props["aria-describedby"],
    descriptionId,
    errorId,
  );

  const connectedControl = cloneElement(control, {
    "aria-describedby": describedBy,
    "aria-errormessage": errorId,
    "aria-invalid": error ? true : control.props["aria-invalid"],
    className: [CONTROL_CLASS_NAME, control.props.className]
      .filter(Boolean)
      .join(" "),
    id,
    required: isRequired,
  });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900" htmlFor={id}>
        {label}
        {isRequired ? (
          <>
            <span aria-hidden="true" className="ml-1 text-rose-700">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>

      {description ? (
        <p className="text-sm leading-5 text-slate-600" id={descriptionId}>
          {description}
        </p>
      ) : null}

      {connectedControl}

      {error ? (
        <p className="text-sm leading-5 text-rose-800" id={errorId}>
          <span className="font-semibold">Error:</span> {error}
        </p>
      ) : null}
    </div>
  );
}
