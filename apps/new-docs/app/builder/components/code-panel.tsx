import { useState } from "react";
import { SourceView, VIEWS, type View, ViewButton } from "~/components/source-view";
import { typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import { ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import { cn } from "~/lib/utils";

import fallbackUrl from "../../../examples/_static/fallback.png?url";
import { BUNDLE } from "../domain/host";
import { utf8, zip } from "../domain/zip";
import type { Generated } from "../workers/domain";

/* The generated files the panel can show. `assets` is bytes the bundle carries, not source. */
type SourceKey = Exclude<keyof Generated, "assets">;

const ORDER = ["ts", "js", "html", "csv"] satisfies ReadonlyArray<SourceKey>;

const FILENAME = {
  ts: VIEWS.ts.filename,
  js: BUNDLE.chart,
  html: BUNDLE.html,
  csv: BUNDLE.data,
} satisfies Record<SourceKey, string>;

export const CodePanel = ({
  generated,
  note,
}: {
  readonly generated: Generated | undefined;
  readonly note?: string | null;
}) => {
  const [view, setView] = useState<View>("ts");
  const source = generated?.[view];
  const ready = generated !== undefined && note == null;

  const downloadBundle = async () => {
    if (!ready || generated === undefined) return;
    /* The image the chart shows in place of itself when the data fails to load. The
       page names it either way, so it travels with the bundle rather than 404ing. */
    const fallback = await fetch(fallbackUrl)
      /* `fetch` rejects only when the network does, so a 404 arrives here as a perfectly
         good response carrying an error page - which would ship as the image. */
      .then(async (response) => (response.ok ? new Uint8Array(await response.arrayBuffer()) : null))
      .catch(() => null);
    /* Whatever else the chart loads - a map's geometry, say - travels with it for the same reason. */
    const extras = await Promise.all(
      generated.assets.map(async (asset) =>
        fetch(asset.source)
          .then(async (response) =>
            response.ok
              ? { name: asset.path, content: new Uint8Array(await response.arrayBuffer()) }
              : null,
          )
          .catch(() => null),
      ),
    );
    save(
      "chart-bundle.zip",
      new Blob(
        [
          zip([
            { name: BUNDLE.html, content: utf8(generated.html.raw) },
            { name: BUNDLE.chart, content: utf8(generated.js.raw) },
            { name: BUNDLE.data, content: utf8(generated.csv.raw) },
            ...(fallback === null ? [] : [{ name: BUNDLE.fallback, content: fallback }]),
            ...extras.filter((entry) => entry !== null),
          ]),
        ],
        { type: "application/zip" },
      ),
    );
  };

  return (
    /* `@container`: the view buttons show their text label only when the panel is wide enough. */
    <div className="@container flex h-136 max-h-[80vh] min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border @4xl/page:h-auto @4xl/page:max-h-none @4xl/page:min-h-40 @4xl/page:flex-1">
      <div className="flex flex-wrap items-center gap-1.5 border-b px-1.5 py-1.5">
        <ToggleButtonGroup
          aria-label="Generated file"
          variant="segmented"
          size="sm"
          value={view}
          onValueChange={setView}
        >
          {ORDER.map((key) => (
            <ViewButton key={key} view={key} />
          ))}
        </ToggleButtonGroup>
        <span className="flex-1" />
        {source !== undefined && (
          <span className={typefaceCodeLabel("hidden pr-1 text-muted-foreground @[40rem]:inline")}>
            {source.raw.split("\n").length} lines
          </span>
        )}
        <Button
          size="xs"
          variant="ghost"
          disabled={!ready || source === undefined}
          onClick={() =>
            source !== undefined &&
            save(FILENAME[view], new Blob([source.raw], { type: "text/plain" }))
          }
        >
          Download
        </Button>
        <Button size="xs" variant="outline" onClick={downloadBundle} disabled={!ready}>
          Download bundle
        </Button>
      </div>
      <p
        role="status"
        className={
          note == null ? "sr-only" : typefaceMeta("border-b bg-muted px-3 py-2 text-foreground")
        }
      >
        {note ?? ""}
      </p>
      <SourceView
        source={source}
        copyable={ready}
        className={cn("min-h-0 flex-1", !ready && "opacity-60")}
      />
    </div>
  );
};

function save(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
