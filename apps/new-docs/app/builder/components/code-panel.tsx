import { useState } from "react";
import { SourceView, VIEWS, type View, ViewButton } from "~/components/source-view";
import { typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import { ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import { cn } from "~/lib/utils";

import { BUNDLE } from "../domain/host";
import { zip } from "../domain/zip";
import type { Generated } from "../workers/domain";

const ORDER = ["ts", "js", "html", "csv"] satisfies ReadonlyArray<keyof Generated>;

const FILENAME = {
  ts: VIEWS.ts.filename,
  js: BUNDLE.chart,
  html: BUNDLE.html,
  csv: BUNDLE.data,
} satisfies Record<keyof Generated, string>;

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

  const downloadBundle = () => {
    if (!ready || generated === undefined) return;
    save(
      "chart-bundle.zip",
      new Blob(
        [
          zip([
            { name: BUNDLE.html, text: generated.html.raw },
            { name: BUNDLE.chart, text: generated.js.raw },
            { name: BUNDLE.data, text: generated.csv.raw },
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
