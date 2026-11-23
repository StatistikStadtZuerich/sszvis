import { type App, useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface Status {
  readonly message: string;
  readonly error: boolean;
}

const WAITING: Status = { message: "Waiting for a chart…", error: false };
const DRAWING: Status = { message: "Drawing…", error: false };
const DONE: Status = { message: "", error: false };

async function call<T>(app: App, name: string, args: Record<string, unknown>): Promise<T> {
  const result = await app.callServerTool({ name, arguments: args });
  if (result.isError === true) {
    const text = result.content.find((block) => block.type === "text");
    throw new Error(text?.type === "text" ? text.text : `${name} failed`);
  }
  return result.structuredContent as T;
}

const loadAssets = async (app: App, update: ChartUpdate) =>
  Object.fromEntries(
    await Promise.all(
      update.assets.map(async (asset) => {
        const result = await app.readServerResource({ uri: `sszvis://topo/${asset.file}` });
        const content = result.contents[0];
        if (content === undefined || !("text" in content)) {
          throw new Error(`No topology at sszvis://topo/${asset.file}`);
        }
        return [asset.path, JSON.parse(content.text) as unknown] as const;
      }),
    ),
  );

export function ChartApp() {
  const [update, setUpdate] = useState<ChartUpdate>();
  const [recipes, setRecipes] = useState<readonly RecipeSummary[]>([]);
  const [status, setStatus] = useState<Status>(WAITING);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");
  const chart = useRef<HTMLDivElement>(null);

  const { app } = useApp({
    appInfo: { name: "sszvis chart", version: "0.0.0" },
    capabilities: {},
  });
  useHostStyles(app, app?.getHostContext());

  const refresh = useCallback(
    async (spec: Spec, recipe?: RecipeKey) => {
      if (app === null) return;
      setStatus(DRAWING);
      try {
        const [next, described] = await Promise.all([
          call<ChartUpdate>(
            app,
            "update_chart",
            recipe === undefined ? { spec } : { spec, recipe },
          ),
          recipes.length > 0
            ? Promise.resolve({ recipes })
            : call<{ recipes: readonly RecipeSummary[] }>(app, "describe_recipes", {}),
        ]);
        setRecipes(described.recipes);
        setUpdate(next);
        if (chart.current !== null) runChart(chart.current, next, await loadAssets(app, next));
        setStatus(DONE);
      } catch (error) {
        setStatus({ message: error instanceof Error ? error.message : String(error), error: true });
      }
    },
    [app, recipes],
  );

  useEffect(() => {
    if (app === null) return;
    const onInput = () => setStatus(DRAWING);
    const onResult = (result: { isError?: boolean; structuredContent?: unknown }) => {
      if (result.isError === true) return;
      const content = result.structuredContent as { readonly spec?: Spec } | undefined;
      if (content?.spec !== undefined) void refresh(content.spec);
    };
    const onContext = (context: { displayMode?: string }) => {
      if (context.displayMode !== undefined) setFullscreen(context.displayMode === "fullscreen");
    };
    app.addEventListener("toolinput", onInput);
    app.addEventListener("toolresult", onResult);
    app.addEventListener("hostcontextchanged", onContext);
    return () => {
      app.removeEventListener("toolinput", onInput);
      app.removeEventListener("toolresult", onResult);
      app.removeEventListener("hostcontextchanged", onContext);
    };
  }, [app, refresh]);

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
                onChange={(key) => void refresh(update.spec, key)}
              />
            </FieldSet>
            <FieldSet>
              <FieldLegend>Mapping</FieldLegend>
              <FieldGroup>
                <Mapping
                  recipe={recipe}
                  spec={update.spec}
                  table={table}
                  onChange={(spec) => void refresh(spec)}
                />
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Chart features</FieldLegend>
              <FieldGroup>
                <Features
                  recipe={recipe}
                  spec={update.spec}
                  onChange={(spec) => void refresh(spec)}
                />
              </FieldGroup>
            </FieldSet>
          </aside>
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-col gap-3">
          {update !== undefined && (
            <div className="flex items-center gap-2">
              <ToggleButtonGroup
                aria-label="View"
                value={view}
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
                <Button variant="outline" size="sm" className="ml-auto" onClick={toggleFullscreen}>
                  {fullscreen ? <Minimize2Icon /> : <Maximize2Icon />}
                  {fullscreen ? "Done" : "Edit"}
                </Button>
              )}
            </div>
          )}
          {status.message !== "" && (
            <p
              id="status"
              className={cn(
                "text-xs",
                status.error ? "whitespace-pre-wrap text-destructive" : "text-muted-foreground",
              )}
            >
              {status.message}
            </p>
          )}
          {/* Always mounted, so the chart drawn into it survives a switch of view or mode. */}
          <div ref={chart} hidden={view !== "preview"} className="chart-card rounded-md p-4" />
          {view === "code" && update !== undefined && <CodePanel update={update} />}
        </section>
      </main>
    </TooltipProvider>
  );
}
