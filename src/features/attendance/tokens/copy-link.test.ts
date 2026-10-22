import { afterEach, expect, it, vi } from "vitest";
import { copyRegistrationLink } from "./copy-link";
afterEach(() => vi.unstubAllGlobals());
it("copies through the secure clipboard API when available", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  expect(await copyRegistrationLink("https://example.test/register/fictional")).toBe(true);
  expect(writeText).toHaveBeenCalledWith("https://example.test/register/fictional");
});
it.each([true, false])("falls back on LAN HTTP and always removes the temporary field: %s", async copied => {
  const field = { value: "", style: {}, setAttribute: vi.fn(), select: vi.fn(), remove: vi.fn() };
  const appendChild = vi.fn(), execCommand = vi.fn().mockReturnValue(copied);
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("not allowed")) } });
  vi.stubGlobal("HTMLElement", class {});
  vi.stubGlobal("document", { activeElement: null, createElement: () => field, body: { appendChild }, execCommand });
  expect(await copyRegistrationLink("http://192.168.1.8:3000/register/fictional")).toBe(copied);
  expect(execCommand).toHaveBeenCalledWith("copy");
  expect(field.select).toHaveBeenCalledOnce();
  expect(field.remove).toHaveBeenCalledOnce();
});
