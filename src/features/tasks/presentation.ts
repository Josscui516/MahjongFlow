export const TASK_STATUS_LABELS = {completed:"Completed",in_progress:"In progress",not_started:"Not started"} as const;
const DATE = new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeZone:"UTC"});
export function taskDateLabel(value:string):string { const date=new Date(`${value}T00:00:00Z`); return Number.isNaN(date.valueOf()) ? "Date unavailable" : DATE.format(date); }
