import { Eye, EyeOff, LoaderCircle, Table2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Sources } from "virtual:examples";
import { CopyButton } from "~/components/copy-button";
import { JavaScriptIcon, TypeScriptIcon } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { ToggleButton, ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import { typefaceCode, typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";

export type { Sources };
export type LoadSources = () => Promise<{ readonly default: Sources }>;

const VIEWS = {
  ts: { label: "TypeScript", filename: "chart.ts", icon: TypeScriptIcon },
  js: { label: "JavaScript", filename: "chart.js", icon: JavaScriptIcon },
  csv: { label: "Data", filename: "data.csv", icon: Table2 },
} as const;

const LANGUAGE_VIEWS: ReadonlyArray<string> = ["ts", "js"];

/** Whether a view name is one the panel has a label and icon for. */
const isView = (view: string): view is keyof typeof VIEWS => view in VIEWS;

export const SourcePanel = ({
  views,
  load,
  initial,
}: {
  readonly views: ReadonlyArray<string>;
  readonly load: LoadSources;
  readonly initial?: string;
}) => {
  const keys = views;
  const [active, setActive] = useState(initial && keys.includes(initial) ? initial : keys[0]);
  const [expanded, setExpanded] = useState(false);
  const [sources, setSources] = useState<Sources | null>(null);
  const bodyId = useId();

  /*
   * The sources live in their own chunk - highlighted code outweighs
   * everything else on the page - so they are fetched the first time a reader
   * opens the panel rather than shipped with it.
   */
  useEffect(() => {
    if (!expanded || sources !== null) return;
    let current = true;
    load().then((module) => {
      if (current) setSources(module.default);
    });
    return () => {
      current = false;
    };
  }, [expanded, sources, load]);

  const source = sources?.[active];

  const select = (view: string) => {
    setActive(view);
    setExpanded(true);
  };

  const languages = LANGUAGE_VIEWS.filter((key) => keys.includes(key));
  const extras = keys.filter((key) => !LANGUAGE_VIEWS.includes(key));

  return (
    <div className="@container min-w-0">
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-1.5",
          expanded && "border-border border-b",
        )}
      >
        <ToggleButtonGroup
          aria-label="Source language"
          variant="segmented"
          size="sm"
          value={expanded ? (active ?? "") : ""}
          onValueChange={select}
        >
          {languages.map((key) => (
            <ViewButton key={key} view={key} />
          ))}
        </ToggleButtonGroup>

        {extras.length > 0 && <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />}

        {extras.length > 0 && (
          <ToggleButtonGroup
            aria-label="Other sources"
            size="sm"
            value={expanded ? (active ?? "") : ""}
            onValueChange={select}
          >
            {extras.map((key) => (
              <ViewButton key={key} view={key} />
            ))}
          </ToggleButtonGroup>
        )}

        <span className="flex-1" />

        {expanded && (
          <span className={typefaceCodeLabel("pr-1 text-muted-foreground")}>
            {active !== undefined && isView(active) ? VIEWS[active].filename : active}
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          title={expanded ? "Hide the source" : "Show the source"}
          className="text-muted-foreground"
        >
          {expanded ? <EyeOff /> : <Eye />}
          <span className="hidden @[26rem]:inline">{expanded ? "Hide" : "Source"}</span>
        </Button>
      </div>

      <div id={bodyId} hidden={!expanded} className="group relative min-w-0">
        {source === undefined ? (
          <div
            className={typefaceMeta(
              "flex items-center gap-2 bg-code-block p-4 text-muted-foreground",
            )}
            role="status"
          >
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            Loading the source…
          </div>
        ) : source.html === null ? (
          // No grammar for this file type - show it as plain text
          <pre className={typefaceCode("max-h-104 overflow-auto bg-code-block p-4")}>
            {source.raw}
          </pre>
        ) : (
          <div
            className={typefaceCode(
              "max-h-104 overflow-auto bg-code-block p-4 [&_pre]:bg-transparent!",
            )}
            dangerouslySetInnerHTML={{ __html: source.html }}
          />
        )}
        {source !== undefined && (
          <CopyButton getValue={() => source.raw} className="opacity-0 group-hover:opacity-100" />
        )}
      </div>

      {expanded && source?.lines !== undefined && (
        <p className={typefaceMeta("border-border border-t px-4 py-2 text-muted-foreground")}>
          Showing the first lines of {source.lines.toLocaleString()}.{" "}
          <a href={source.url} download className="underline hover:text-foreground">
            Open the full file
          </a>
          .
        </p>
      )}
    </div>
  );
};

const ViewButton = ({ view }: { readonly view: string }) => {
  const meta = isView(view) ? VIEWS[view] : undefined;
  const Icon = meta?.icon;
  return (
    <ToggleButton value={view} title={meta ? `${meta.label} — ${meta.filename}` : view}>
      {Icon ? <Icon /> : null}
      <span className="hidden @[26rem]:inline">{meta?.label ?? view}</span>
    </ToggleButton>
  );
};
