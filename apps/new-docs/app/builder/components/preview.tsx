import { Option, Schema } from "effect";
import { useEffect, useRef, useState } from "react";
import { typefaceCaption, typefaceMeta } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import template from "../../../examples/_template.html?raw";
import { harmlessValues } from "../domain/csv";
import { escapeHtml, libraryTags } from "../domain/host";
import type { Asset } from "../domain/spec";
import { Notice } from "./notice";

const ASSETS = "/preview/_assets";
const FALLBACK = "/preview/_static/fallback.png";

const decodeError = Schema.decodeUnknownOption(
  Schema.Struct({ __sszvisPreviewError: Schema.String }),
);

const decodeHeight = Schema.decodeUnknownOption(
  Schema.Struct({ __sszvisPreviewHeight: Schema.Number }),
);

const REPORTER = `    <script>
      (function () {
        var post = function (message) { parent.postMessage(message, "*"); };
        var send = function (message) {
          post({ __sszvisPreviewError: String(message) });
        };
        window.addEventListener("error", function (event) { send(event.message); });
        window.addEventListener("unhandledrejection", function () {
          send("The chart's data promise rejected.");
        });
        var report = function () {
          var height = document.body.scrollHeight;
          /* Zero means nothing has drawn yet; the page keeps its reserved height. */
          if (height > 0) post({ __sszvisPreviewHeight: height });
        };
        new ResizeObserver(report).observe(document.documentElement);
        window.addEventListener("load", report);
      })();
    </script>
`;

const RESERVED_HEIGHT = 420;

export type MissingRole = { readonly key: string; readonly label: string };

export type PreviewStatus =
  | { readonly kind: "ready" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "stale" }
  | { readonly kind: "incomplete"; readonly roles: readonly MissingRole[] };

const sentence = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

export const roleList = (roles: readonly MissingRole[]): string =>
  sentence.format(roles.map((role) => role.label));

const Blocked = ({ children }: { readonly children: React.ReactNode }) => (
  <div
    className="grid place-items-center rounded-lg border border-dashed px-6 text-center"
    style={{ minHeight: RESERVED_HEIGHT }}
  >
    <div className="max-w-[44ch] space-y-3">{children}</div>
  </div>
);

const Incomplete = ({ roles }: { readonly roles: readonly MissingRole[] }) => {
  const first = roles[0];
  const one = roles.length === 1;
  return (
    <Blocked>
      <p className={typefaceMeta("text-foreground")}>
        {sentence.format(roles.map((role) => role.label))} {one ? "has" : "have"} no column yet.
      </p>
      <p className={typefaceCaption()}>
        The chart draws as soon as step 3 points {one ? "it" : "them"} at a column in your data.
      </p>
      {first !== undefined && (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            const target = document.getElementById(`mapping-${first.key}`);
            target?.scrollIntoView({ block: "center", behavior: "smooth" });
            target?.focus();
          }}
        >
          Go to mapping
        </Button>
      )}
    </Blocked>
  );
};

export const Preview = ({
  js,
  csv,
  title,
  status,
  pending = false,
  assets = [],
  scripts = [],
}: {
  readonly js: string;
  readonly csv: string;
  readonly title: string;
  readonly status: PreviewStatus;
  readonly pending?: boolean;
  readonly assets?: readonly Asset[];
  readonly scripts?: readonly string[];
}) => {
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [height, setHeight] = useState(RESERVED_HEIGHT);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const config = {
    data: `data:text/csv;charset=utf-8,${encodeURIComponent(harmlessValues(csv))}`,
    id: "#sszvis-chart",
    fallback: FALLBACK,
    /*
     * The bundle puts these beside the chart; here the app already serves them, and
     * the frame has no base URL of its own to resolve a relative path against.
     */
    ...Object.fromEntries(
      assets.map((asset) => [asset.key, new URL(asset.source, window.location.origin).href]),
    ),
  };

  const srcDoc =
    status.kind === "ready" && js !== ""
      ? template
          .replaceAll("{{title}}", () => escapeHtml(title))
          .replaceAll("{{assets}}", () => ASSETS)
          .replaceAll("{{config}}", () => JSON.stringify(config, null, 2))
          .replaceAll("{{scripts}}", () => libraryTags(scripts) + REPORTER)
          .replaceAll("// {{chart}}", () => indent(js, 6).trimStart())
      : "";

  useEffect(() => {
    setRuntimeError(null);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      Option.map(decodeError(event.data), (report) => setRuntimeError(report.__sszvisPreviewError));
      Option.map(decodeHeight(event.data), (report) => setHeight(report.__sszvisPreviewHeight));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [srcDoc]);

  return (
    <div className="flex flex-col gap-3">
      {status.kind === "error" ? (
        <Notice
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive"
          alert
          title="Cannot generate the chart"
          body={status.message}
        />
      ) : status.kind === "incomplete" ? (
        <Incomplete roles={status.roles} />
      ) : status.kind === "stale" ? (
        <Blocked>
          <p className={typefaceMeta("text-foreground")}>
            The chart could not be rebuilt from the current settings.
          </p>
          <p className={typefaceCaption()}>
            The code panel still holds the last chart that compiled.
          </p>
        </Blocked>
      ) : (
        /* White is the chart's own ground, so it stays on the frame and off every other state. */
        <div className="relative overflow-hidden rounded-lg border bg-white">
          {pending && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-white/70"
            >
              <p className={typefaceCaption()}>Rebuilding…</p>
            </div>
          )}
          <iframe
            key={srcDoc}
            ref={frameRef}
            title="Chart preview"
            srcDoc={srcDoc}
            tabIndex={-1}
            style={{ height }}
            className="block w-full border-0"
          />
        </div>
      )}
      {runtimeError !== null && status.kind === "ready" && (
        <Notice
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive"
          alert
          title="The chart threw while drawing"
          body={runtimeError}
        />
      )}
    </div>
  );
};

const indent = (code: string, spaces: number) => {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
};
