import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "./global-error";

describe("global error boundary", () => {
  it("renders a standalone safe recovery document", () => {
    const privateMessage = "private provider response";
    const html = renderToStaticMarkup(
      <GlobalError
        error={Object.assign(new Error(privateMessage), {
          digest: "safe-digest",
        })}
        retry={vi.fn()}
      />,
    );

    expect(html).toContain("<html");
    expect(html).toContain("<body");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Reload MahjongFlow");
    expect(html).not.toContain(privateMessage);
  });
});
