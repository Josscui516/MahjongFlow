"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("MahjongFlow root failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <html lang="en">
      <head>
        <title>MahjongFlow unavailable</title>
      </head>
      <body
        style={{
          background: "#f1f5f9",
          color: "#0f172a",
          fontFamily: "Arial, Helvetica, sans-serif",
          margin: 0,
        }}
      >
        <main
          style={{
            alignItems: "center",
            display: "grid",
            minHeight: "100vh",
            padding: "40px 16px",
          }}
        >
          <section
            role="alert"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
              margin: "0 auto",
              maxWidth: 680,
              overflow: "hidden",
              width: "100%",
            }}
          >
            <div style={{ background: "#022c22", color: "white", padding: 28 }}>
              <strong style={{ fontSize: 20 }}>MahjongFlow</strong>
              <div style={{ color: "#a7f3d0", fontSize: 14, marginTop: 4 }}>
                Committee coordination
              </div>
            </div>
            <div style={{ padding: 32 }}>
              <div
                aria-hidden="true"
                style={{
                  alignItems: "center",
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: 12,
                  color: "#be123c",
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  height: 44,
                  justifyContent: "center",
                  width: 44,
                }}
              >
                <svg
                  fill="none"
                  height="22"
                  viewBox="0 0 24 24"
                  width="22"
                >
                  <path
                    d="M12 8v4m0 4h.01M10.3 4.8 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h1 style={{ fontSize: 28, margin: "20px 0 0" }}>
                MahjongFlow is temporarily unavailable
              </h1>
              <p
                style={{
                  color: "#475569",
                  fontSize: 16,
                  lineHeight: 1.6,
                  margin: "12px 0 0",
                  maxWidth: 580,
                }}
              >
                The application could not recover this page. Try reloading the
                workspace; no raw system details have been displayed.
              </p>
              <button
                onClick={retry}
                style={{
                  background: "#022c22",
                  border: 0,
                  borderRadius: 12,
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 24,
                  minHeight: 44,
                  padding: "10px 20px",
                }}
                type="button"
              >
                Reload MahjongFlow
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
