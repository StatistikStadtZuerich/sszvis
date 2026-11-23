import { Effect } from "effect";
import { McpProtocol, McpTest } from "effect/ai";
import { describe, expect, test } from "vitest";

// Vitest's callbacks are async functions; the Effect code they await is the subject.
// @effect-diagnostics asyncFunction:off

import { Capabilities } from "../src/capabilities.ts";
import type { RecipeSummary } from "@sszvis/chart-builder/spec";

import type { ChartUpdate, RecipeList } from "../src/chartTools.ts";
import { EXTENSION } from "../src/mcpApp.ts";

/*
 * The server's contract with a host, over Effect's in-memory MCP client: the same JSON-RPC
 * encoding and routing as HTTP, without a transport.
 */
const withClient = <A>(use: (client: McpTest.Client) => Effect.Effect<A, unknown>) =>
  Effect.runPromise(
    Effect.scoped(
      McpTest.makeClient(Capabilities, {
        protocols: [McpProtocol.v2025_11_25],
        extensions: { [EXTENSION]: {} },
      }).pipe(Effect.flatMap(use)),
    ),
  );

const call = (name: string, args: Record<string, unknown>) =>
  withClient((client) => client.callTool({ name, arguments: args }));

const text = (result: { readonly content: readonly unknown[] }) =>
  result.content
    .map((block) =>
      typeof block === "object" && block !== null && "text" in block ? String(block.text) : "",
    )
    .join("");

describe("what the server offers a host", () => {
  test("should link render_chart to the chart app and hide update_chart from the model", async () => {
    const { tools } = await withClient((client) => client.listTools());
    const meta = Object.fromEntries(tools.map((tool) => [tool.name, tool._meta]));

    expect(Object.keys(meta).sort()).toEqual([
      "describe_recipes",
      "list_recipes",
      "render_chart",
      "update_chart",
    ]);
    expect(meta["render_chart"]).toEqual({ ui: { resourceUri: "ui://sszvis/chart" } });
    expect(meta["update_chart"]).toEqual({ ui: { visibility: ["app"] } });
    expect(meta["describe_recipes"]).toEqual({ ui: { visibility: ["app"] } });
  });

  test("should serve the app as an MCP App page that may load from unpkg", async () => {
    const { contents } = await withClient((client) =>
      client.readResource({ uri: "ui://sszvis/chart" }),
    );
    const [page] = contents;

    expect(page?.mimeType).toBe("text/html;profile=mcp-app");
    expect(page && "text" in page ? page.text : "").toContain("https://unpkg.com/sszvis@3");
    expect(page?._meta).toEqual({
      ui: { csp: { resourceDomains: ["https://unpkg.com"] }, prefersBorder: true },
    });
  });

  test("should serve the topology a map names as a resource", async () => {
    const { contents } = await withClient((client) =>
      client.readResource({ uri: "sszvis://topo/stadt-zurich.json" }),
    );
    const [topology] = contents;
    const json: unknown = JSON.parse(topology && "text" in topology ? topology.text : "");

    expect(json).toMatchObject({ type: "Topology" });
  });
});

describe("list_recipes", () => {
  test("should describe every recipe and sample", async () => {
    const result = await call("list_recipes", {});
    const { recipes, samples } = result.structuredContent as RecipeList;

    expect(recipes.map((recipe) => recipe.key)).toEqual([
      "bar-chart-vertical",
      "bar-chart-horizontal",
      "bar-chart-vertical-stacked",
      "bar-chart-horizontal-stacked",
      "bar-chart-vertical-grouped",
      "line-chart",
      "area-chart-stacked",
      "map-choropleth",
    ]);
    expect(samples.every((sample) => sample.columns.length > 0)).toBe(true);
  });
});

describe("describe_recipes", () => {
  test("should give the app the swatches list_recipes leaves out for the model", async () => {
    const result = await call("describe_recipes", {});
    const { recipes: summaries } = result.structuredContent as {
      recipes: readonly RecipeSummary[];
    };
    const swatched = summaries.flatMap((recipe) =>
      recipe.options.flatMap((option) => option.choices ?? []),
    );

    expect(summaries).toHaveLength(8);
    expect(swatched.some((choice) => choice.swatch !== undefined)).toBe(true);
  });
});

describe("render_chart", () => {
  test.each([
    "bar-chart-vertical",
    "bar-chart-horizontal",
    "bar-chart-vertical-stacked",
    "bar-chart-horizontal-stacked",
    "bar-chart-vertical-grouped",
    "line-chart",
    "area-chart-stacked",
    "map-choropleth",
  ])("should draw %s from its own sample", async (recipe) => {
    const result = await call("render_chart", { recipe });

    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({ spec: { recipe } });
  });

  test("should tell the model what it drew without echoing the CSV", async () => {
    const csv = "Sektor,Anzahl\nIndustrie,10\nDienstleistung,20";
    const result = await call("render_chart", { recipe: "bar-chart-vertical", csv });

    expect(text(result)).toContain("Vertical bar of 2 rows");
    expect(text(result)).not.toContain("Dienstleistung");
  });

  test("should take the column mapping, options and features it is given", async () => {
    const result = await call("render_chart", {
      recipe: "bar-chart-vertical",
      csv: "Sektor,Anzahl,Jahr\nIndustrie,10,2020\nDienstleistung,20,2020",
      fields: { category: "Sektor", value: "Anzahl" },
      options: { title: "Employees" },
      features: [],
    });

    expect(result.structuredContent).toMatchObject({
      spec: {
        fields: { category: "Sektor", value: "Anzahl" },
        chosen: ["category", "value"],
        options: { title: "Employees" },
        features: [],
      },
    });
  });

  test("should match the roles it is not given to the columns it is not given", async () => {
    const result = await call("render_chart", {
      recipe: "bar-chart-vertical-stacked",
      csv: "Quarter,Region,Sales\nQ1,Nord,10\nQ1,Süd,20\nQ2,Nord,30\nQ2,Süd,40",
      fields: { category: "Region" },
    });
    const { spec } = result.structuredContent as { spec: { fields: Record<string, string> } };

    expect(spec.fields["category"]).toBe("Region");
    expect(spec.fields["series"]).toBe("Quarter");
    expect(spec.fields["value"]).toBe("Sales");
  });

  test.each([
    [{ recipe: "pie-chart" }, "Expected"],
    [{ recipe: "line-chart", fields: { date: "Nope" } }, 'The data has no column "Nope"'],
    [{ recipe: "line-chart", fields: { colour: "Datum" } }, 'has no role "colour"'],
    [{ recipe: "line-chart", options: { size: "big" } }, 'has no option "size"'],
    [{ recipe: "line-chart", features: ["sparkles"] }, 'has no feature "sparkles"'],
    [{ recipe: "line-chart", csv: "a,b\n1,2", sample: "regen-november" }, "not both"],
    [{ recipe: "line-chart", csv: "Name\nZürich" }, "No column fits the role(s)"],
    [
      { recipe: "bar-chart-vertical", options: { unit: "<img src=x onerror=alert(1)>" } },
      "plain text",
    ],
    [
      {
        recipe: "bar-chart-vertical-stacked",
        csv: `${Array.from({ length: 41 }, (_, at) => `c${at}`).join(",")}\n${"1,".repeat(40)}1`,
      },
      "at most 40",
    ],
  ])("should reject %j with a message the model can act on", async (args, message) => {
    const result = await call("render_chart", args);

    expect(result.isError).toBe(true);
    expect(text(result)).toContain(message);
  });
});

describe("update_chart", () => {
  test("should refuse a spec whose options carry markup, as render_chart does", async () => {
    const result = await call("render_chart", { recipe: "bar-chart-vertical" });
    const { spec } = result.structuredContent as { spec: { options: Record<string, string> } };
    const marked = { ...spec, options: { unit: "<b>kg</b>" } };

    const refused = await call("update_chart", { spec: marked });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain("plain text");
  });

  const rendered = async () => {
    const result = await call("render_chart", {
      recipe: "bar-chart-vertical",
      options: { title: "Employees" },
    });
    return (result.structuredContent as { spec: unknown }).spec;
  };

  test("should return the code, the preview's CSV and the columns", async () => {
    const result = await call("update_chart", { spec: await rendered() });
    const update = result.structuredContent as ChartUpdate;

    expect(update.js).toContain("sszvis.app(");
    expect(update.ts).toContain("sszvis.app<");
    expect(update.columns.length).toBeGreaterThan(0);
    expect(update.compatible).toContain("bar-chart-vertical");
  });

  test("should switch recipe and keep the options the two share", async () => {
    const result = await call("update_chart", {
      spec: await rendered(),
      recipe: "bar-chart-horizontal",
    });
    const update = result.structuredContent as ChartUpdate;

    expect(update.spec.recipe).toBe("bar-chart-horizontal");
    expect(update.spec.options).toEqual({ title: "Employees" });
  });

  test("should give the preview the table as written", async () => {
    const result = await call("render_chart", {
      recipe: "bar-chart-vertical",
      csv: "Sektor,Anzahl\nR&D,10\n<b>Bau</b>,20",
    });
    const { spec } = result.structuredContent as { spec: unknown };
    const update = (await call("update_chart", { spec })).structuredContent as ChartUpdate;

    /* Escaping the cells drew R&D on the axis as R&amp;D; the chart escapes its tooltips. */
    expect(update.csv).toBe("Sektor,Anzahl\nR&D,10\n<b>Bau</b>,20");
  });

  test("should name the map's topology so the app can read it", async () => {
    const result = await call("render_chart", { recipe: "map-choropleth" });
    const { spec } = result.structuredContent as { spec: unknown };
    const update = (await call("update_chart", { spec })).structuredContent as ChartUpdate;

    expect(update.assets.map((asset) => asset.file)).toEqual(["stadt-zurich.json"]);
    expect(update.scripts).toEqual(["topojson"]);
  });
});
