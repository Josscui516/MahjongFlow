"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {completeTaskAction} from "./editor/actions";
export function TaskCompleteButton({taskId}: Readonly<{taskId:string}>) {
 const router=useRouter(); const [pending,setPending]=useState(false); const [error,setError]=useState("");
 async function complete() {
  if(pending) return; setPending(true); setError("");
  try { const result=await completeTaskAction(taskId); if(result.ok) router.refresh(); else setError(result.code === "PERMISSION_DENIED" ? "You do not have permission to complete this task." : "The task could not be completed. Try again."); }
  catch {setError("The task could not be completed. Try again.");} finally {setPending(false);}
 }
 return <div><button type="button" disabled={pending} aria-busy={pending} onClick={complete} className="min-h-11 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60">{pending ? "Completing…" : "Mark complete"}</button>{error ? <p role="alert" className="mt-2 max-w-xs text-sm text-rose-800">{error}</p> : null}</div>;
}
