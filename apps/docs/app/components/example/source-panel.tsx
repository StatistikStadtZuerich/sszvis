import { Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Sources } from "virtual:examples";
import { SourceView, VIEWS, ViewButton, isView } from "~/components/source-view";
import { Button } from "~/components/ui/button";
import { ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import { typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";

export type { Sources };
export type LoadSources = () => Promise<{ readonly default: Sources }>;

const LANGUAGE_VIEWS: ReadonlyArray<string> = ["ts", "js"];

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

      <div id={bodyId} hidden={!expanded}>
        <SourceView source={source} className="max-h-104" />
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
