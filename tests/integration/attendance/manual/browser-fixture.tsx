import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import type { AttendanceAuditRecord } from "@/features/attendance/records";
import type { ManualAttendanceAction, ManualAttendanceState } from "@/features/attendance/manual/contracts";
import { ConnectedManualAttendanceForm, ManualAttendanceForm } from "@/features/attendance/manual/ManualAttendanceForm";

const event = { id: "33000000-0000-4000-8000-000000000001", name: "Fictional Spring Social" };
const records: readonly AttendanceAuditRecord[] = [{
  id: "33000000-0000-4000-8000-000000000011", eventId: event.id,
  participantId: "33000000-0000-4000-8000-000000000021", participantName: "River Example",
  participantEmail: "river@example.test", status: "confirmed", method: "qr", recordedBy: null,
  checkedInAt: "2026-09-28T08:05:00.123456+00:00", updatedAt: "2026-09-28T08:05:00.123456+00:00",
}, {
  id: "33000000-0000-4000-8000-000000000012", eventId: event.id,
  participantId: "33000000-0000-4000-8000-000000000022", participantName: "Taylor Example",
  participantEmail: "taylor@example.test", status: "voided", method: "manual",
  recordedBy: { displayName: "Fictional Staff" },
  checkedInAt: "2026-09-28T08:10:00.123456+00:00", updatedAt: "2026-09-28T08:12:00.123456+00:00",
}];

type TestControl = {
  mount: (options?: { empty?: boolean; connected?: boolean }) => void;
  updateRecords: () => void;
  settle: (state: ManualAttendanceState) => void;
  reject: () => void;
  calls: Record<string, FormDataEntryValue>[];
  updates: ManualAttendanceState[];
  refreshes: number;
  eventId: string;
};

declare global {
  interface Window { manualAttendanceTest: TestControl }
}

const root = createRoot(document.getElementById("root")!);
let generation = 0;
let currentRecords = records;
let connected = false;
let resolve: (state: ManualAttendanceState) => void;
let reject: () => void;
const action: ManualAttendanceAction = async (_previous, data) => {
  window.manualAttendanceTest.calls.push(Object.fromEntries(data.entries()));
  return new Promise((done, fail) => { resolve = done; reject = () => fail(new Error("Fictional transport failure")); });
};

function render() {
  const props = { event, records: currentRecords, action };
  root.render(connected
    ? <ConnectedManualAttendanceForm key={generation} {...props} />
    : <ManualAttendanceForm key={generation} {...props}
        onUpdated={(state) => { window.manualAttendanceTest.updates.push(state); }}
        onRefresh={() => { window.manualAttendanceTest.refreshes += 1; }} />);
}

window.manualAttendanceTest = {
  eventId: event.id, calls: [], updates: [], refreshes: 0,
  mount(options = {}) {
    generation += 1;
    currentRecords = options.empty ? [] : records;
    connected = options.connected ?? false;
    this.calls = []; this.updates = []; this.refreshes = 0;
    render();
  },
  updateRecords() {
    currentRecords = [{ ...records[0], status: "voided", recordedBy: { displayName: "Fictional Corrector" }, updatedAt: "2026-09-28T08:15:00.654321+00:00" }, records[1]];
    render();
  },
  settle(state) { resolve(state); },
  reject() { reject(); },
};
window.manualAttendanceTest.mount();
