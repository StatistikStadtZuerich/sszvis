import { useState } from "react";
import { SourceView, VIEWS, type View, ViewButton } from "~/components/source-view";
import { typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import { ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import { cn } from "~/lib/utils";

import fallbackUrl from "../../../examples/_static/fallback.png?url";
import { bundleEntries, MissingAssetError } from "../domain/bundle";
import { BUNDLE } from "../domain/host";
import { zip } from "../domain/zip";
import type { Generated } from "../workers/domain";

/* The generated files the panel can show. `assets` is bytes the bundle carries, not source. */
type SourceKey = Exclude<keyof Generated, "assets" | "scripts">;

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
  /* A download that could not read one of the chart's files, reported where `note` is. */
  const [bundleError, setBundleError] = useState<string | null>(null);
  const source = generated?.[view];
  const ready = generated !== undefined && note == null;

  const downloadBundle = async () => {
    if (!ready || generated === undefined) return;
    setBundleError(null);
    try {
      const entries = await bundleEntries(
        { html: generated.html.raw, js: generated.js.raw, csv: generated.csv.raw },
        generated.assets,
        fallbackUrl,
      );
      save("chart-bundle.zip", new Blob([zip(entries)], { type: "application/zip" }));
    } catch (cause) {
      /*
       * An archive missing one of the chart's own files would download happily and then
       * fail to draw, with nothing to say why - so the failure is reported here instead.
       */
      setBundleError(
        cause instanceof MissingAssetError
          ? cause.message
          : "The archive could not be built. Please try again.",
      );
    }
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
          (bundleError ?? note) == null
            ? "sr-only"
            : typefaceMeta("border-b bg-muted px-3 py-2 text-foreground")
        }
      >
        {bundleError ?? note ?? ""}
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
