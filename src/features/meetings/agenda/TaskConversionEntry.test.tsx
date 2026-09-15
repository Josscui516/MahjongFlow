import {renderToStaticMarkup} from "react-dom/server";
import {expect,it} from "vitest";
import {TaskConversionEntry} from "./TaskConversionEntry";
it("shows an existing task and status without offering another conversion", () => {
 const html=renderToStaticMarkup(<TaskConversionEntry sourceId="decision" sourceKind="decision" task={{id:"task",title:"Fictional booking",sourceId:"decision",sourceKind:"decision",status:"completed"}}/>);
 expect(html).toContain("View task: Fictional booking");
 expect(html).toContain("Completed");
 expect(html).toContain('href="/tasks/task"');
 expect(html).not.toContain("Create task");
});
it("does not treat unavailable task links as an unconverted decision", () => {
 const html=renderToStaticMarkup(<TaskConversionEntry sourceId="decision" sourceKind="decision" unavailable/>);
 expect(html).toContain("Task links unavailable");
 expect(html).not.toContain("Create task");
});
