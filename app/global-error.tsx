"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./design-tokens.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "grid",
          placeItems: "center",
          background: "var(--rama-surface-canvas)",
          color: "var(--rama-text-primary)",
          fontFamily: "var(--rama-font-family-sans)",
        }}
      >
        <main
          style={{
            inlineSize: "min(100% - var(--rama-space-gutter), 36rem)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--rama-text-muted)",
              fontSize: "var(--rama-font-size-sm)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Rama
          </p>
          <h1
            style={{
              margin: "var(--rama-space-gutter) 0 0",
              fontFamily: "var(--rama-font-family-serif)",
              fontSize: "var(--rama-font-size-3xl)",
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            The decision desk needs a fresh start.
          </h1>
          <p
            style={{
              margin: "var(--rama-space-gutter) auto 0",
              color: "var(--rama-text-body)",
              fontSize: "var(--rama-font-size-base)",
              lineHeight: 1.6,
            }}
          >
            Your saved work is unchanged. Reload this view to continue.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "var(--rama-component-button-min-height)",
              margin: "var(--rama-space-gutter) 0 0",
              border: "1px solid var(--rama-text-primary)",
              borderRadius: "var(--rama-component-button-radius)",
              padding: "0 var(--rama-space-gutter)",
              background: "var(--rama-text-primary)",
              color: "var(--rama-text-inverse)",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
