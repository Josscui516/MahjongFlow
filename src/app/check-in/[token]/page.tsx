import { CheckInForm, createSelfCheckInGateway, isCheckInToken } from "@/features/attendance/self-check-in";

const SYDNEY = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Sydney" });

export default async function CheckInPage({ params }: PageProps<"/check-in/[token]">) {
  const { token } = await params;
  const result = isCheckInToken(token) ? await createSelfCheckInGateway().getContext(token) : { code: "UNAVAILABLE" as const, ok: false as const };
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">MahjongFlow participant check-in</p>
        {result.ok ? <><h1 className="mt-2 text-2xl font-bold text-slate-950">{result.context.eventName}</h1><p className="mt-2 text-slate-700"><time dateTime={result.context.startsAt}>{SYDNEY.format(new Date(result.context.startsAt))}</time> · {result.context.location}</p><CheckInForm studentIdRequired={result.context.studentIdRequired} token={token} /></> : result.code === "SYSTEM_ERROR" ? <><h1 className="mt-2 text-2xl font-bold text-slate-950">Check-in temporarily unavailable</h1><p className="mt-3 text-slate-700" role="alert">Please try again later or contact event staff.</p></> : <><h1 className="mt-2 text-2xl font-bold text-slate-950">Check-in unavailable</h1><p className="mt-3 text-slate-700">This link is invalid, inactive, or outside its check-in window.</p></>}
      </section>
    </main>
  );
}
