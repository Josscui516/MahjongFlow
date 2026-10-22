import { expect, it } from "vitest";
import { taskChoiceReferences, taskMenuPlacement } from "./task-choice-presentation";

it("opens upward near the bottom and keeps results inside the viewport", () => {
  const placement = taskMenuPlacement(680, 724, 0, 800, 240);
  expect(placement.side).toBe("top");
  expect(680 - 4 - placement.maxHeight).toBeGreaterThanOrEqual(0);
});

it("opens downward when there is room, including short result lists", () => {
  expect(taskMenuPlacement(100, 144, 0, 800, 240).side).toBe("bottom");
  expect(taskMenuPlacement(600, 644, 0, 800, 64).side).toBe("bottom");
});

it("limits results to usable space when the mobile keyboard shrinks the viewport", () => {
  const placement = taskMenuPlacement(180, 224, 100, 300, 240);
  expect(placement.maxHeight).toBeLessThanOrEqual(76);
  expect(placement.maxHeight).toBeGreaterThan(0);
});

it("uses viewport offsets instead of assuming the visible viewport starts at zero", () => {
  expect(taskMenuPlacement(620, 664, 500, 1000, 240).side).toBe("bottom");
});

it("distinguishes duplicate names even when their short ID suffixes collide", () => {
  const choices = [
    { id: "11111111-1111-4111-8111-111111abcdef", title: "Test" },
    { id: "22222222-2222-4222-8222-222222abcdef", title: " test " },
    { id: "33333333-3333-4333-8333-333333333333", title: "Different task" },
  ];
  const references = taskChoiceReferences(choices);
  expect(references.get(choices[0].id)).toBeTruthy();
  expect(references.get(choices[0].id)).not.toBe(references.get(choices[1].id));
  expect(references.has(choices[2].id)).toBe(false);
});
