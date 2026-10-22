import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ManualAttendanceForm } from "./ManualAttendanceForm";

const event = { id: "33000000-0000-4000-8000-000000000001", name: "Fictional manual event" };

describe("ManualAttendanceForm initial markup", () => {
  it("offers an explicit no-records state without an available correction action", () => {
    const html = renderToStaticMarkup(<ManualAttendanceForm event={event} records={[]} action={async () => ({ status: "idle" })} />);
    expect(html).toContain('type="hidden" name="operation" value="create"');
    expect(html).toContain("existing participant");
    expect(html).not.toContain("Correct an existing record");
    expect(html).not.toContain(event.name);
    expect(html).toContain('name="confirmation"');
    expect(html).not.toContain('name="eventId"');
    expect(html).not.toContain('name="recordedBy"');
    expect(html).not.toContain('name="checkedInAt"');
    expect(html).not.toContain('name="studentId"');
  });
});
