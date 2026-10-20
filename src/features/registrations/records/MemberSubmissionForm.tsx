"use client";
import { useState, useRef, type FormEvent } from "react";
import { submitMemberListChange } from "./member-submission-action";

export function MemberSubmissionForm({list,eventId=null,requiresStudentId=false}:Readonly<{
  list:"dinner"|"registration";eventId?:string|null;requiresStudentId?:boolean;
}>){
  const [operation,setOperation]=useState("add"),[pending,setPending]=useState(false),[message,setMessage]=useState("");
  const lock=useRef(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(lock.current)return;
    if(operation==="remove"&&!window.confirm(list==="dinner"?"Remove this email's standing dinner eligibility for all events?":"Cancel this email's registration for this event?"))return;
    lock.current=true;setPending(true);setMessage("");const form=event.currentTarget;
    try{const r=await submitMemberListChange(list,eventId,new FormData(form));
      setMessage(r.ok?"Request processed. No existing list information is disclosed. Contact safety staff if verification is needed.":r.code==="VALIDATION"?"Check the entered details and required student ID.":"The request could not be confirmed. Try again or contact safety staff.");
      if(r.ok)form.reset();
    }catch{setMessage("The request could not be confirmed. Try again or contact safety staff.");}
    finally{lock.current=false;setPending(false);}
  }
  return <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="text-xl font-semibold">{list==="dinner"?"Submit dinner eligibility changes":"Submit registration changes"}</h2>
    <p className="text-sm text-slate-600">Members can add or remove a known person using their email. Only safety staff can view the existing list. Submitting does not show whether an email already exists.</p>
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={pending} className="space-y-4">
      <label className="block text-sm font-semibold">Operation<select name="operation" value={operation} onChange={e=>{setOperation(e.target.value);setMessage("");}} className="mt-2 block rounded-lg border p-3"><option value="add">Add or restore</option><option value="remove">{list==="dinner"?"Remove eligibility":"Cancel registration"}</option></select></label>
      {operation==="add"?<label className="block text-sm font-semibold">Full name<input name="fullName" required maxLength={120} className="mt-2 block w-full rounded-lg border p-3"/></label>:null}
      <label className="block text-sm font-semibold">Email<input name="email" type="email" required maxLength={254} className="mt-2 block w-full rounded-lg border p-3"/></label>
      {operation==="add"&&requiresStudentId?<label className="block text-sm font-semibold">Student ID<input name="studentId" required maxLength={32} className="mt-2 block w-full rounded-lg border p-3"/></label>:null}
      <p className="text-sm text-slate-600">{list==="registration"?"Registration does not itself confirm attendance. Removing cancels the registration and preserves its history.":"Removing disables standing eligibility; existing issued meals remain recorded."}</p>
      <button disabled={pending} className="min-h-11 rounded-lg bg-emerald-950 px-4 text-white disabled:opacity-60">{pending?"Submitting…":"Submit change"}</button>
    </fieldset></form><p role="status" aria-live="polite">{message}</p>
  </section>;
}
