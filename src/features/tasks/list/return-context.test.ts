import {describe,it,expect} from "vitest";
import {taskListReturn,taskDetailHref} from "./return-context";
describe("task list return context",()=>{
 it("retains filters, sort and pagination",()=>{expect(taskListReturn("/tasks?status=completed&page=3&sort=updated_recent")).toBe("/tasks?status=completed&sort=updated_recent&page=3");});
 it.each(["https://example.com","//example.com","/tasks/other","/tasks?returnTo=https://example.com","/tasks?status=invalid"])("restricts destinations: %s",value=>{expect(taskListReturn(value)).toBe("/tasks");});
 it("encodes context through edit routes",()=>{expect(taskDetailHref("fixture","/tasks?page=2",true)).toBe("/tasks/fixture/edit?returnTo=%2Ftasks%3Fpage%3D2");});
});
