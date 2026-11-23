/**
 * The chart app. `render_chart` hands it a spec; it asks `update_chart` for the code, runs
 * that code against the published sszvis the generated page loads, and sends every edit
 * the reader makes back through `update_chart`.
 */
import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import type { ColumnName, Spec } from "@sszvis/chart-builder/spec";

import type { ChartUpdate, RecipeGuide, RecipeList } from "../../src/chartTools.ts";
import { installChartRuntime, runChart } from "./runtime.ts";
import "./style.css";

const element = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`#${id} is missing from the page`);
  return found as T;
};

const controls = element<HTMLFormElement>("controls");
const status = element<HTMLParagraphElement>("status");
const preview = element<HTMLElement>("preview");
const code = element<HTMLElement>("code");
const source = element<HTMLElement>("source");
const codeFile = element<HTMLSelectElement>("code-file");
const copy = element<HTMLButtonElement>("copy");
const tabs = document.querySelector<HTMLElement>(".tabs");

const app = new App({ name: "sszvis chart", version: "0.0.0" });

let guides: readonly RecipeGuide[] = [];

/** How a spec spells a role left without a column, as chart-builder's own `UNMAPPED` does. */
const UNMAPPED = "" as ColumnName;
let current: ChartUpdate | undefined;

const showStatus = (message: string, error = false) => {
  status.textContent = message;
  status.classList.toggle("error", error);
  status.hidden = message === "";
};

const applyContext = (context: McpUiHostContext) => {
  if (context.theme !== undefined) applyDocumentTheme(context.theme);
  if (context.styles?.variables !== undefined) applyHostStyleVariables(context.styles.variables);
  if (context.styles?.css?.fonts !== undefined) applyHostFonts(context.styles.css.fonts);
};

/** A tool's structured result, or the text it failed with. */
const call = async <T>(name: string, args: Record<string, unknown>): Promise<T> => {
  const result = await app.callServerTool({ name, arguments: args });
  if (result.isError === true) {
    const text = result.content.find((block) => block.type === "text");
    throw new Error(text?.type === "text" ? text.text : `${name} failed`);
  }
  return result.structuredContent as T;
};

const loadGuides = async () => {
  if (guides.length === 0) guides = (await call<RecipeList>("list_recipes", {})).recipes;
  return guides;
};

/** Topology the chart would `d3.json`, read as MCP resources, keyed by the path it asks for. */
const loadAssets = async (update: ChartUpdate) =>
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

const update = async (spec: Spec, recipe?: string) => {
  showStatus("Drawing…");
  try {
    const [next] = await Promise.all([
      call<ChartUpdate>("update_chart", recipe === undefined ? { spec } : { spec, recipe }),
      loadGuides(),
    ]);
    current = next;
    renderControls(next);
    renderCode();
    runChart(next, await loadAssets(next));
    showStatus("");
  } catch (error) {
    showStatus(error instanceof Error ? error.message : String(error), true);
  }
};

// Controls -------------------------------------------------------------------

const labelled = (text: string, control: HTMLElement) => {
  const label = document.createElement("label");
  label.append(text, control);
  return label;
};

const select = (
  name: string,
  choices: readonly { readonly value: string; readonly label: string }[],
  value: string,
) => {
  const menu = document.createElement("select");
  menu.name = name;
  for (const choice of choices) menu.add(new Option(choice.label, choice.value));
  menu.value = value;
  return menu;
};

const withSpec = (change: (spec: Spec) => Spec) => {
  if (current !== undefined) void update(change(current.spec));
};

function renderControls(next: ChartUpdate) {
  const guide = guides.find((candidate) => candidate.key === next.spec.recipe);
  if (guide === undefined) return;
  controls.replaceChildren();
  controls.hidden = false;
  if (tabs !== null) tabs.hidden = false;

  const recipe = select(
    "recipe",
    guides
      .filter((candidate) => next.compatible.includes(candidate.key) || candidate === guide)
      .map((candidate) => ({ value: candidate.key, label: candidate.label })),
    guide.key,
  );
  recipe.addEventListener("change", () => void update(next.spec, recipe.value));
  controls.append(labelled("Chart", recipe));

  for (const role of guide.roles) {
    const columns = next.columns.map((column) => ({ value: column, label: column }));
    const menu = select(
      `role-${role.key}`,
      role.optional ? [{ value: "", label: "—" }, ...columns] : columns,
      next.spec.fields[role.key] ?? "",
    );
    menu.title = role.hint;
    menu.addEventListener("change", () =>
      withSpec((spec) => ({
        ...spec,
        fields: {
          ...spec.fields,
          [role.key]: next.columns.find((column) => column === menu.value) ?? UNMAPPED,
        },
        chosen: spec.chosen.includes(role.key) ? spec.chosen : [...spec.chosen, role.key],
      })),
    );
    controls.append(labelled(role.label, menu));
  }

  for (const option of guide.options) {
    const value = next.spec.options[option.key] ?? "";
    const set = (chosen: string) =>
      withSpec((spec) => ({ ...spec, options: { ...spec.options, [option.key]: chosen } }));
    if (option.choices === undefined) {
      const input = document.createElement("input");
      input.type = "text";
      input.name = `option-${option.key}`;
      input.value = value;
      input.placeholder = option.fallback;
      input.addEventListener("change", () => set(input.value));
      controls.append(labelled(option.label, input));
    } else {
      const menu = select(`option-${option.key}`, option.choices, value || option.fallback);
      menu.addEventListener("change", () => set(menu.value));
      controls.append(labelled(option.label, menu));
    }
  }

  const features = document.createElement("fieldset");
  for (const feature of guide.features) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.name = `feature-${feature.key}`;
    box.checked = next.spec.features.includes(feature.key);
    box.title = feature.hint;
    box.addEventListener("change", () =>
      withSpec((spec) => ({
        ...spec,
        features: box.checked
          ? [...spec.features, feature.key]
          : spec.features.filter((key) => key !== feature.key),
      })),
    );
    const label = document.createElement("label");
    label.append(box, feature.label);
    features.append(label);
  }
  controls.append(features);
}

// Preview and code -----------------------------------------------------------

function renderCode() {
  if (current === undefined) return;
  source.textContent = codeFile.value === "js" ? current.js : current.ts;
}

codeFile.addEventListener("change", renderCode);

copy.addEventListener("click", async () => {
  const text = source.textContent ?? "";
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* A sandboxed frame may lack clipboard-write; selecting the text still lets the reader copy it. */
    const range = document.createRange();
    range.selectNodeContents(source);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);
    document.execCommand("copy");
  }
  copy.textContent = "Copied";
  setTimeout(() => (copy.textContent = "Copy"), 1500);
});

tabs?.addEventListener("click", (event) => {
  const tab = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-view]");
  if (tab === null) return;
  for (const button of tabs.querySelectorAll("[data-view]")) {
    button.setAttribute("aria-selected", String(button === tab));
  }
  preview.hidden = tab.dataset["view"] !== "preview";
  code.hidden = tab.dataset["view"] !== "code";
});

// Host -----------------------------------------------------------------------

installChartRuntime();

app.ontoolinput = () => showStatus("Drawing…");
app.ontoolresult = (result) => {
  if (result.isError === true) return;
  const content = result.structuredContent as { readonly spec?: Spec } | undefined;
  if (content?.spec !== undefined) void update(content.spec);
};
app.onhostcontextchanged = applyContext;

await app.connect();
const context = app.getHostContext();
if (context !== undefined) applyContext(context);
