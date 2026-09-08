import type { RegistrationCountResult } from "./contracts";

/** Safe projection only: the committee never receives the records used to count. */
export function RegistrationCount({ result }: Readonly<{ result: RegistrationCountResult }>) {
  if (!result.ok) return <p role="status">Registration count unavailable.</p>;
  return <p><strong>{result.registrationCount}</strong> currently registered</p>;
}
