"use client";
export default function RegistrationError({ reset }: Readonly<{ reset: () => void }>) {
  return <section className="space-y-4 p-6"><p role="alert">Registrations could not be loaded.</p><button className="rounded-lg border px-4 py-2" onClick={reset}>Try again</button></section>;
}
