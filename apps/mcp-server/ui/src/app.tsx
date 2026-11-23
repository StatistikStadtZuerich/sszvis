import { type App, useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import { CircleAlertIcon, LoaderCircleIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/ui/button.tsx";
import { FieldGroup, FieldLegend, FieldSet } from "./components/ui/field.tsx";
import { ToggleButton, ToggleButtonGroup } from "./components/ui/toggle-button-group.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { cn } from "./lib/utils.ts";
import { ChartType } from "./panels/chart-type.tsx";
import { CodePanel } from "./panels/code.tsx";
import { Features } from "./panels/features.tsx";
import { Mapping } from "./panels/mapping.tsx";
import { runChart } from "./runtime.ts";
import { parse } from "@sszvis/chart-builder/csv";
import type { RecipeKey, RecipeSummary, Spec } from "@sszvis/chart-builder/spec";
import type { ChartUpdate } from "../../src/chartTools.ts";

/*
 * What the app is doing, for the overlay on the chart and for screen readers. None of it
 * takes space in the layout: a redraw keeps the last chart in place under a spinner.
 */
type Status =
  | { readonly state: "waiting" | "drawing" | "done" }
  | { readonly state: "error"; readonly message: string };

const WAITING: Status = { state: "waiting" };
const DRAWING: Status = { state: "drawing" };
const DONE: Status = { state: "done" };

const ANNOUNCEMENT = { waiting: "Waiting for a chart…", drawing: "Drawing…", done: "" } as const;

async function call<T>(app: App, name: string, args: Record<string, unknown>): Promise<T> {
  const result = await app.callServerTool({ name, arguments: args });
  if (result.isError === true) {
    const text = result.content.find((block) => block.type === "text");
    throw new Error(text?.type === "text" ? text.text : `${name} failed`);
  }
  return result.structuredContent as T;
}

/*
 * The map's TopoJSON, through the app-only read_topology tool rather than resources/read,
 * which a host may refuse outside the app's own widget. Fetched once per file: an edit
 * redraws the same map.
 */
const topologies = new Map<string, Promise<unknown>>();

const topology = (app: App, file: string) => {
  let found = topologies.get(file);
  if (found === undefined) {
    found = call<{ json: string }>(app, "read_topology", { file }).then(
      ({ json }) => JSON.parse(json) as unknown,
    );
    /* A failed read is not kept, so the next draw asks again. */
    found.catch(() => topologies.delete(file));
    topologies.set(file, found);
  }
  return found;
};

/** Topology the chart would `d3.json`, keyed by the path it asks for. */
const loadAssets = async (app: App, update: ChartUpdate) =>
  Object.fromEntries(
    await Promise.all(
      update.assets.map(async (asset) => [asset.path, await topology(app, asset.file)] as const),
    ),
  );

/** The text a tool failed with, which is what the model was shown too. */
const errorText = (result: { readonly content?: readonly { type: string; text?: string }[] }) =>
  result.content?.find((block) => block.type === "text")?.text ?? "The chart could not be drawn.";

/** A spec to draw: from the model's `render_chart` call, or from an edit in the panels. */
interface Request {
  readonly spec: Spec;
  readonly recipe?: RecipeKey;
}

export function ChartApp() {
  const [update, setUpdate] = useState<ChartUpdate>();
  const [recipes, setRecipes] = useState<readonly RecipeSummary[]>([]);
  const [status, setStatus] = useState<Status>(WAITING);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [request, setRequest] = useState<Request>();
  const chart = useRef<HTMLDivElement>(null);
  /* Bumped by every request, so one that finishes after a newer one has started is dropped. */
  const generation = useRef(0);

  const { app } = useApp({
    appInfo: { name: "sszvis chart", version: "0.0.0" },
    capabilities: {},
    /*
     * Before connecting, as the SDK requires: a host may send the tool result as soon as the
     * app has initialised, and a notification nobody is listening for is not sent again. The
     * listeners only record what arrived; the effect below draws it once the app is ready.
     */
    onAppCreated: (created) => {
      created.addEventListener("toolinput", () => setStatus(DRAWING));
      created.addEventListener("toolresult", (result) => {
        if (result.isError === true) {
          generation.current += 1;
          setStatus({ state: "error", message: errorText(result) });
          return;
        }
        const content = result.structuredContent as { readonly spec?: Spec } | undefined;
        if (content?.spec !== undefined) setRequest({ spec: content.spec });
      });
      /* The host gave up on the call, so nothing more is coming for it. */
      created.addEventListener("toolcancelled", ({ reason }) => {
        generation.current += 1;
        setStatus({
          state: "error",
          message: `The chart was cancelled${reason === undefined ? "" : `: ${reason}`}.`,
        });
      });
      created.addEventListener("hostcontextchanged", (context) => {
        if (context.displayMode !== undefined) setFullscreen(context.displayMode === "fullscreen");
      });
    },
  });

  /*
   * The context the host connected with is stored, not announced: a host that opens (or
   * restores) the app fullscreen sends no hostcontextchanged for it. So read it once here.
   */
  useEffect(() => {
    const mode = app?.getHostContext()?.displayMode;
    if (mode !== undefined) setFullscreen(mode === "fullscreen");
  }, [app]);
  useHostStyles(app, app?.getHostContext());

  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;

  useEffect(() => {
    if (app === null || request === undefined) return;
    const mine = (generation.current += 1);
    const current = () => mine === generation.current;
    setStatus(DRAWING);
    void (async () => {
      try {
        const known = recipesRef.current;
        const [next, described] = await Promise.all([
          call<ChartUpdate>(app, "update_chart", { ...request }),
          known.length > 0
            ? Promise.resolve({ recipes: known })
            : call<{ recipes: readonly RecipeSummary[] }>(app, "describe_recipes", {}),
        ]);
        if (!current()) return;
        const assets = await loadAssets(app, next);
        if (!current()) return;
        setRecipes(described.recipes);
        setUpdate(next);
        if (chart.current !== null) await runChart(chart.current, next, assets);
        if (current()) setStatus(DONE);
      } catch (error) {
        if (current()) {
          setStatus({
            state: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();
  }, [app, request]);

  const refresh = (spec: Spec, recipe?: RecipeKey) =>
    setRequest(recipe === undefined ? { spec } : { spec, recipe });

  /*
   * A chart redrawn while Code was showing measured a hidden, zero-width container. Showing
   * it again is a resize as far as the chart is concerned, so tell sszvis so.
   */
  useEffect(() => {
    if (view !== "preview") return;
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(frame);
  }, [view]);

  const table = useMemo(
    () => (update === undefined ? undefined : parse(update.spec.csv)),
    [update],
  );
  const recipe = recipes.find((candidate) => candidate.key === update?.spec.recipe);
  const canFullscreen =
    app?.getHostContext()?.availableDisplayModes?.includes("fullscreen") ?? false;

  const toggleFullscreen = async () => {
    if (app === null) return;
    const result = await app.requestDisplayMode({ mode: fullscreen ? "inline" : "fullscreen" });
    setFullscreen(result.mode === "fullscreen");
  };

  return (
    <TooltipProvider>
      <main
        className={cn("grid gap-4 p-3", fullscreen && "h-dvh grid-cols-[minmax(18rem,24rem)_1fr]")}
      >
        {fullscreen && update !== undefined && recipe !== undefined && table !== undefined ? (
          <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto pr-2">
            <FieldSet>
              <FieldLegend>Chart type</FieldLegend>
              <ChartType
                recipes={recipes}
                table={table}
                kinds={update.spec.kinds}
                value={update.spec.recipe}
                onChange={(key) => refresh(update.spec, key)}
              />
            </FieldSet>
            <FieldSet>
              <FieldLegend>Mapping</FieldLegend>
              <FieldGroup>
                <Mapping
                  recipe={recipe}
                  spec={update.spec}
                  table={table}
                  onChange={(spec) => refresh(spec)}
                />
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Chart features</FieldLegend>
              <FieldGroup>
                <Features recipe={recipe} spec={update.spec} onChange={(spec) => refresh(spec)} />
              </FieldGroup>
            </FieldSet>
          </aside>
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-col gap-3">
          {/* There from the start, disabled until a chart arrives, so nothing moves when it does. */}
          <div className="flex items-center gap-2">
            <ToggleButtonGroup
              aria-label="View"
              value={view}
              disabled={update === undefined}
              onValueChange={(next) => setView(next === "code" ? "code" : "preview")}
            >
              <ToggleButton value="preview" size="sm">
                Preview
              </ToggleButton>
              <ToggleButton value="code" size="sm">
                Code
              </ToggleButton>
            </ToggleButtonGroup>
            {canFullscreen && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={update === undefined}
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize2Icon /> : <Maximize2Icon />}
                {fullscreen ? "Done" : "Edit"}
              </Button>
            )}
          </div>

          <p id="status" className="sr-only" aria-live="polite">
            {status.state === "error" ? status.message : ANNOUNCEMENT[status.state]}
          </p>

          <div className={cn("relative", view !== "preview" && "hidden")}>
            {/* Always mounted, so the chart drawn into it survives a switch of view or mode. */}
            <div
              ref={chart}
              className={cn(
                "chart-card rounded-md p-4 transition-opacity duration-200",
                update === undefined && "min-h-64",
                status.state === "drawing" && update !== undefined && "opacity-50",
              )}
            />
            {status.state !== "done" && status.state !== "error" && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute flex items-center gap-2 text-xs text-neutral-500",
                  update === undefined ? "inset-0 justify-center" : "top-3 right-3",
                )}
              >
                <LoaderCircleIcon className="size-4 animate-spin" />
                {update === undefined && ANNOUNCEMENT[status.state]}
              </div>
            )}
            {status.state === "error" && (
              <div
                role="alert"
                className="absolute inset-x-3 top-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-background p-3 text-xs whitespace-pre-wrap text-destructive shadow-sm"
              >
                <CircleAlertIcon className="mt-px size-4 shrink-0" />
                {status.message}
              </div>
            )}
          </div>
          {view === "code" && update !== undefined && <CodePanel update={update} />}
        </section>
      </main>
    </TooltipProvider>
  );
}
