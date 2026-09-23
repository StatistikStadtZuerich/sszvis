import { Effect } from "effect";
import * as d3 from "d3";
import * as sszvis from "sszvis";
import * as topojson from "topojson-client";
import tsBlankSpace from "ts-blank-space";
import { afterEach, describe, expect, test } from "vitest";

import { assetsFor, compile } from "./domain/compile";
import { initialSpec } from "./domain/initial-spec";
import { sampleFor } from "./domain/samples";
import { findRecipe, recipes } from "./domain/recipes";
import {
  ColumnName,
  FeatureKey,
  GEO,
  GEO_LABEL,
  OptionKey,
  RoleKey,
  SERIES,
  summarize,
  VALUE,
  type Recipe,
  type Spec,
} from "./domain/spec";

/*
 * What a generated chart draws, which is the one thing the node suites cannot see.
 *
 * `compile.test.ts` proves every feature combination type-checks against the library's
 * real types, and the domain tests prove the spec turns into the source we expect. Both
 * pass happily for a chart that renders nothing: an accessor reading a column that is
 * not there, a scale left without a domain and a stack that collapses all produce valid
 * TypeScript and an empty SVG. So this runs the emitted code the way a reader would and
 * counts the marks that come out.
 *
 * It deliberately does not sweep the feature powerset - `compile.test.ts` already does,
 * and a browser is far too slow for 2^n. One chart per recipe, drawn from the sample it
 * ships with, is enough to catch a recipe that emits a chart nobody can see.
 */

/** What a map area carries: the shape it draws, under the id its topology gives it. */
type MapArea = { readonly geoJson: { readonly id?: string } };

/** The control's buttons, which are the same element whichever recipe drew them. */
const BUTTON = ".sszvis-control-buttonGroup__item";

const findRecipeOrThrow = (key: string): Recipe => Effect.runSync(findRecipe(key));

/** The width the chart lays itself out for; sszvis measures the container, so it needs one. */
const WIDTH = 800;

/* The chart reads its data over the network. A data: URL keeps that real without a server. */
const csvUrl = (csv: string) => `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

/**
 * What each recipe should draw from the sample it opens on, as an exact count.
 *
 * Exact rather than "more than none", and a selector naming the data marks alone,
 * because a chart carries marks that have nothing to do with its data: a legend draws
 * circles, a ruler draws a dot, and every bar gets an invisible tooltip anchor. A
 * count over all of them stays comfortably above zero while the bars themselves are
 * missing, which is the failure this file exists to catch.
 *
 * A recipe with no entry here fails rather than passing quietly, so a new one has to
 * say what it draws.
 */
const EXPECTED: Readonly<Record<string, { readonly marks: string; readonly count: number }>> = {
  /* Six rows in `beschaeftigte-sektor`, one bar each. */
  "bar-chart-vertical": { marks: "rect.sszvis-bar", count: 6 },
  /* The same sample lying down, so the same six bars. */
  "bar-chart-horizontal": { marks: "rect.sszvis-bar", count: 6 },
  /* `berufsfeld-jahr` is four decades by four occupational fields, so sixteen slices. */
  "bar-chart-vertical-stacked": { marks: "rect.sszvis-bar", count: 16 },
  /* The same sample lying down, so the same sixteen slices. */
  "bar-chart-horizontal-stacked": { marks: "rect.sszvis-bar", count: 16 },
  /* The same sixteen values again, four bars side by side in each of four groups. */
  "bar-chart-vertical-grouped": { marks: "rect.sszvis-bar", count: 16 },
  /* `zu-und-wegzuege` splits five dates into two series, so two lines. */
  "line-chart": { marks: "path.sszvis-line", count: 2 },
  /* The same two series, as two stacked bands. The specific class, not the generic
     `.sszvis-path`, which the pie and the line share. */
  "area-chart-stacked": { marks: "path.sszvis-stacked-area-path", count: 2 },
  /*
   * The areas that were matched to a row, rather than all of them. A map draws every
   * area whatever the data says, at full size, so a count of `.sszvis-map__area` is 34
   * for a chart that matched nothing at all - which is precisely how a wrong geography,
   * or a code column read the wrong way, fails. Of the 34 statistical quarters the
   * sample names, three have no value, and those are hatched rather than filled.
   */
  "map-choropleth": {
    marks: ".sszvis-map__area:not(.sszvis-map__area--undefined)",
    count: 31,
  },
};

/** How long to let a chart finish drawing before reading it. */
const PAINT_TIMEOUT_MS = 5000;

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Waits until the chart has drawn the marks it is going to draw.
 *
 * `sszvis.app` renders on an animation frame and its `init` awaits a fetch first, so a
 * test that reads the container straight after mounting sees it empty. Waiting a fixed
 * number of frames is what this did first, and it failed about one run in seven on a
 * loaded machine - a wait long enough on an idle laptop is not long enough beside a
 * type-check, and a flaky harness is worse than none.
 *
 * So it waits for the count to reach `expected` and then settle for a frame, rather than
 * for a duration. A chart that draws the wrong number still fails, by timing out and
 * asserting whatever it did draw.
 */
const painted = async (container: HTMLElement, marks: string, expected: number) => {
  const deadline = Date.now() + PAINT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await frame();
    if (container.querySelectorAll(marks).length >= expected) {
      /* One more frame, so a count still being appended to is read whole. */
      await frame();
      return;
    }
  }
};

/** Runs a recipe's emitted chart in a container of its own and hands back that container. */
const draw = async (
  recipe: Recipe,
  spec: Spec,
  expected: { readonly marks: string; readonly count: number },
  width: number = WIDTH,
): Promise<HTMLElement> => {
  const ts = Effect.runSync(compile(recipe, spec));
  const js = tsBlankSpace(ts);

  const container = document.createElement("div");
  container.id = `chart-${recipe.key}`;
  container.style.width = `${width}px`;
  document.body.append(container);

  /*
   * A recipe that loads a second file gets it the way the page would: a URL under a key
   * on `config`. The bytes are the app's own, so this is the same topology the builder
   * would put in the bundle rather than a fixture that could drift from it.
   */
  const assets = await Promise.all(
    assetsFor(recipe, spec).map(async (asset) => [
      asset.key,
      URL.createObjectURL(await (await fetch(asset.source)).blob()),
    ]),
  );
  const config = {
    data: csvUrl(spec.csv),
    id: `#${container.id}`,
    fallback: "",
    ...Object.fromEntries(assets),
  };
  /*
   * The emitted file is a script, not a module: it reads `d3`, `sszvis` and `config` as
   * globals, exactly as the generated index.html supplies them. Running it through
   * `new Function` rather than an import is what keeps this the real artefact.
   *
   * The `sszvis` it is handed is the real module with `app` wrapped, so the handle the
   * chart throws away is kept for `afterEach`. A chart holds its container through a
   * resize listener on the window, which removing the DOM does not release: without this
   * every chart the file has ever drawn re-renders into a detached node on the next
   * resize, and they accumulate for the length of the run.
   */
  new Function("d3", "sszvis", "topojson", "config", js)(
    d3,
    withTrackedApp(sszvis),
    topojson,
    config,
  );

  await painted(container, expected.marks, expected.count);
  return container;
};

/** The apps drawn by the current test, so that `afterEach` can release them. */
const apps: sszvis.AppHandle[] = [];

/* Annotated rather than parameterised, so `props` picks up `app`'s own generics. */
const trackedApp: typeof sszvis.app = (props) => {
  const handle = sszvis.app(props);
  apps.push(handle);
  return handle;
};

const withTrackedApp = (module: typeof sszvis): typeof sszvis => ({ ...module, app: trackedApp });

afterEach(() => {
  /* The listener first, then the node it would have rendered into. */
  for (const app of apps.splice(0)) app.destroy();
  document.body.innerHTML = "";
});

describe("generated charts", () => {
  for (const recipe of recipes) {
    test(`should draw every mark of its sample for ${recipe.key}`, async () => {
      const expected = EXPECTED[recipe.key];
      expect(expected, `no expected mark count for the recipe "${recipe.key}"`).toBeDefined();
      if (expected === undefined) return;

      const container = await draw(recipe, initialSpec(summarize(recipe)), expected);

      const marks = [...container.querySelectorAll<SVGGraphicsElement>(expected.marks)];
      expect(marks).toHaveLength(expected.count);

      /*
       * And every one of them has to occupy space. Counting alone is not enough: a bar
       * whose value column does not exist still renders, as a rect of height 0 - present
       * in the DOM, invisible on screen - so the count stays right while the chart shows
       * nothing. Measured rather than read off an attribute, because each mark type
       * encodes its value in a different one.
       */
      const flat = marks.filter((mark) => {
        const box = mark.getBBox();
        return box.width <= 0 || box.height <= 0;
      });
      expect(flat, `${flat.length} of ${marks.length} marks have no extent`).toHaveLength(0);
    });
  }
});

/*
 * One feature drawn rather than described. A bubble overlay is the only feature in
 * the builder that replaces a chart's marks instead of adding to them: the areas
 * stop carrying the value and the circles start. `compile.test.ts` proves the
 * combination type-checks, and a map whose circles are all radius zero type-checks
 * just as well - it is a grey map with 34 invisible dots, which is a chart that
 * still counts 34 areas.
 */
describe("the bubble overlay", () => {
  test("should draw a circle with a radius for every area that has a value", async () => {
    const recipe = recipes.find((candidate) => candidate.key === "map-choropleth");
    expect(recipe, "the map recipe").toBeDefined();
    if (recipe === undefined) return;

    const base = initialSpec(summarize(recipe));
    const spec = { ...base, features: [FeatureKey.make("bubble")] };
    const marks = { marks: "circle.sszvis-anchored-circle", count: 31 };
    const container = await draw(recipe, spec, marks);

    const circles = [...container.querySelectorAll<SVGCircleElement>(marks.marks)];
    /*
     * A circle per area that matched a row. Radius rather than presence, because the
     * renderer draws one for every feature and gives the ones with nothing to show a
     * radius of zero - which is how a broken join, or a scale left without a domain,
     * would look.
     */
    const drawn = circles.filter((circle) => circle.r.baseVal.value > 0);
    expect(drawn, `${drawn.length} of ${circles.length} bubbles have a radius`).toHaveLength(
      marks.count,
    );

    /* And the areas underneath are all one grey, because the circles carry the value now. */
    const fills = new Set(
      [...container.querySelectorAll(".sszvis-map__area:not(.sszvis-map__area--undefined)")].map(
        (area) => area.getAttribute("fill"),
      ),
    );
    expect(fills, "the base map is not a single colour").toHaveLength(1);
  });
});

/*
 * The other shape the stacked area draws. Leaving the optional series role unmapped
 * emits `""` as the category expression, which stacks every row into a single band -
 * a different path through the recipe from the two-series sample above, and one that
 * also has to suppress a legend whose single entry would have no name. Neither is
 * visible to `compile.test.ts`: both spellings type-check.
 */
describe("a stacked area with no series column", () => {
  test("should draw one band and no legend", async () => {
    const recipe = recipes.find((candidate) => candidate.key === "area-chart-stacked");
    expect(recipe, "the stacked area recipe").toBeDefined();
    if (recipe === undefined) return;

    const base = initialSpec(summarize(recipe));
    const spec: Spec = {
      ...base,
      fields: { ...base.fields, [SERIES]: ColumnName.make("") },
    };
    const marks = { marks: "path.sszvis-stacked-area-path", count: 1 };
    const container = await draw(recipe, spec, marks);

    /*
     * One band rather than two: the five dates of `zu-und-wegzuege` carry two rows each,
     * and with no series to split them they belong to the same band. A count of two here
     * would mean the empty category expression had not collapsed them.
     */
    expect(container.querySelectorAll(marks.marks)).toHaveLength(1);

    /*
     * And no legend, because its one entry would be blank. The mark rather than the
     * group: an empty `<g>` left behind is not what a reader sees.
     */
    expect(container.querySelectorAll(".sszvis-legend__mark")).toHaveLength(0);
  });
});

/*
 * A chart with a filter control, which is the one thing in the builder that changes what
 * a chart draws after it has been drawn.
 *
 * This matters more than it looks. The expression a layer is given its data by reaches
 * the template through a hole, and the recipes project does not constrain that hole's
 * type at all - d3 carries no datum type through `.datum()` into `.call()`, so a hole
 * emitting the wrong rows, or none, type-checks exactly as well as the right one. Every
 * other suite passes for a chart that filters nothing, or filters everything away.
 */
describe("a chart with a filter control", () => {
  /* Seven profiles for each of two genders. Filtered, the chart draws one gender. */
  const SAMPLE = sampleFor("maturitaetsprofil-geschlecht");
  const SLICE = 7;
  const marks = { marks: "rect.sszvis-bar", count: SLICE };

  const controlled = (key = "bar-chart-vertical"): Spec => {
    const recipe = findRecipeOrThrow(key);
    return {
      ...initialSpec(summarize(recipe), SAMPLE.csv),
      control: { kind: "filter", column: ColumnName.make("Geschlecht"), label: "Geschlecht" },
    };
  };

  const bars = (container: HTMLElement) =>
    [...container.querySelectorAll<SVGGraphicsElement>("rect.sszvis-bar")].map((bar) =>
      Math.round(bar.getBBox().height),
    );

  /** The y axis' labels, which are the only numbers the chart writes down. */
  const yLabels = (container: HTMLElement) =>
    [...container.querySelectorAll("text")]
      .map((text) => text.textContent ?? "")
      .filter((label) => /^\d+$/.test(label));

  /** Every bar's box and every area's fill, which is everything a new slice can move. */
  const geometry = (container: HTMLElement) =>
    [
      ...[...container.querySelectorAll<SVGGraphicsElement>("rect.sszvis-bar")].map((bar) => {
        const box = bar.getBBox();
        return `${Math.round(box.width)}x${Math.round(box.height)}`;
      }),
      ...[...container.querySelectorAll(".sszvis-map__area")].map(
        (area) => area.getAttribute("fill") ?? "",
      ),
    ].join();

  /*
   * Waits for the chart to stop moving, rather than for a number of frames.
   *
   * A bar transitions its geometry when its value changes, so the frame after a button is
   * pressed shows the old slice on its way to the new one. Read there, the tallest bar is
   * whichever one happens to be passing through - and the chart's own peak is mid-fall, so
   * it reads higher than either slice ever gets.
   */
  const settled = async (container: HTMLElement) => {
    const deadline = Date.now() + PAINT_TIMEOUT_MS;
    let last = "";
    while (Date.now() < deadline) {
      await frame();
      const now = geometry(container);
      if (now === last) return;
      last = now;
    }
  };

  const press = async (container: HTMLElement, label: string) => {
    const button = [...container.querySelectorAll<HTMLButtonElement>(BUTTON)].find(
      (candidate) => candidate.textContent === label,
    );
    expect(button, `no button labelled ${label}`).toBeDefined();
    button?.click();
    await settled(container);
  };

  test("should draw one slice of the table rather than all of it", async () => {
    const container = await draw(findRecipeOrThrow("bar-chart-vertical"), controlled(), marks);

    /* Fourteen rows in the sample; a chart drawing them all is one that never filtered. */
    expect(container.querySelectorAll("rect.sszvis-bar")).toHaveLength(SLICE);
  });

  test("should offer every value of the column as a choice", async () => {
    const container = await draw(findRecipeOrThrow("bar-chart-vertical"), controlled(), marks);

    const labels = [...container.querySelectorAll(BUTTON)].map((button) => button.textContent);
    expect(labels).toEqual(["Mädchen", "Jungen"]);
    /* The first value in the column's own order, which is the slice the chart opens on. */
    const current = [...container.querySelectorAll(BUTTON)].find(
      (button) => button.getAttribute("aria-checked") === "true",
    );
    expect(current?.textContent).toBe("Mädchen");
  });

  test("should redraw the bars when another value is chosen", async () => {
    const container = await draw(findRecipeOrThrow("bar-chart-vertical"), controlled(), marks);
    await settled(container);
    const before = bars(container);

    await press(container, "Jungen");

    const after = bars(container);
    expect(after).toHaveLength(SLICE);
    expect(after).not.toEqual(before);
  });

  test("should leave the axis where it is when another value is chosen", async () => {
    const container = await draw(findRecipeOrThrow("bar-chart-vertical"), controlled(), marks);
    await settled(container);
    const before = { labels: yLabels(container), tallest: Math.max(...bars(container)) };

    await press(container, "Jungen");

    const after = { labels: yLabels(container), tallest: Math.max(...bars(container)) };
    expect(after.labels).toEqual(before.labels);

    /*
     * And the scale behind them has not moved either, which the labels alone would not
     * show: the two slices peak at 77.0 and 64.3, so a chart measuring each slice against
     * itself draws both peaks at the same height. Drawn against the whole table they stand
     * in proportion, and that ratio is the assertion.
     */
    expect(after.tallest / before.tallest).toBeCloseTo(64.3 / 77, 1);
  });

  /*
   * The two other recipes that take a control. Each reaches its data through holes of its
   * own, so the vertical bar passing says nothing about either of them.
   */
  test("should redraw a horizontal bar chart when another value is chosen", async () => {
    const recipe = findRecipeOrThrow("bar-chart-horizontal");
    const container = await draw(recipe, controlled(recipe.key), marks);
    await settled(container);
    expect(container.querySelectorAll("rect.sszvis-bar")).toHaveLength(SLICE);

    const widest = () =>
      Math.max(
        ...[...container.querySelectorAll<SVGGraphicsElement>("rect.sszvis-bar")].map(
          (bar) => bar.getBBox().width,
        ),
      );
    const before = widest();

    await press(container, "Jungen");

    /* Lying down, so the same proportion between the two peaks, read along the other axis. */
    expect(container.querySelectorAll("rect.sszvis-bar")).toHaveLength(SLICE);
    expect(widest() / before).toBeCloseTo(64.3 / 77, 1);
  });

  test("should reshade a map when another value is chosen", async () => {
    /*
     * A map draws every area whichever rows it was given, so a count cannot tell one slice
     * from both. Two quarters can: Rathaus and Hard are both 25 under public ownership and
     * 45 against 23 under private, so they share a fill in one slice and not in the other.
     * A map shading from both slices at once, or never redrawing, fails one of the two.
     */
    const recipe = findRecipeOrThrow("map-choropleth");
    const sample = sampleFor("eigentuemergruppe-quartier");
    const base = initialSpec(summarize(recipe), sample.csv);
    const spec: Spec = {
      ...base,
      fields: {
        ...base.fields,
        [GEO]: ColumnName.make("Qcode"),
        [GEO_LABEL]: ColumnName.make("Qname"),
        [VALUE]: ColumnName.make("Anteil"),
      },
      control: { kind: "filter", column: ColumnName.make("Eigentuemergruppe"), label: "" },
      /* Without bubbles, which take over from the fills and draw every area grey. */
      features: [FeatureKey.make("legend")],
    };
    const areas = ".sszvis-map__area:not(.sszvis-map__area--undefined)";
    const container = await draw(recipe, spec, { marks: areas, count: 34 });
    await settled(container);

    const fillOf = (id: string) =>
      [...container.querySelectorAll<SVGPathElement>(areas)]
        .find((area) => d3.select<SVGPathElement, MapArea>(area).datum().geoJson.id === id)
        ?.getAttribute("fill");
    /* The topology names a quarter by its code, as a string. */
    const RATHAUS = "11";
    const HARD = "44";

    expect(fillOf(RATHAUS)).toBeDefined();
    expect(fillOf(RATHAUS)).toBe(fillOf(HARD));

    await press(container, "Natürliche Personen");

    expect(fillOf(RATHAUS)).not.toBe(fillOf(HARD));
  });

  test("should give way to a select menu where a row of buttons will not fit", async () => {
    /* Narrower than the palm breakpoint, where the two controls trade places. */
    const container = await draw(findRecipeOrThrow("bar-chart-vertical"), controlled(), marks, 320);

    expect(container.querySelectorAll(BUTTON)).toHaveLength(0);
    const options = [...container.querySelectorAll("select.sszvis-control-select__element option")];
    expect(options.map((option) => option.textContent)).toEqual(["Mädchen", "Jungen"]);
  });

  test("should take a menu when the values would not fit as a row of buttons", async () => {
    /*
     * The thirty-four statistical quarters, which is what a row of buttons cannot hold: the
     * group divides its width evenly but will not shrink a button below its own label, so
     * it runs off the side of the chart instead of compressing. Two categories, so two bars.
     */
    const recipe = findRecipeOrThrow("bar-chart-vertical");
    const sample = sampleFor("eigentuemergruppe-quartier");
    const spec: Spec = {
      ...initialSpec(summarize(recipe), sample.csv),
      fields: {
        [RoleKey.make("category")]: ColumnName.make("Eigentuemergruppe"),
        [RoleKey.make("value")]: ColumnName.make("Anteil"),
      },
      control: { kind: "filter", column: ColumnName.make("Qname"), label: "Quartier" },
    };
    const container = await draw(recipe, spec, { marks: "rect.sszvis-bar", count: 2 });

    expect(container.querySelectorAll(BUTTON)).toHaveLength(0);
    const options = [...container.querySelectorAll("select.sszvis-control-select__element option")];
    expect(options).toHaveLength(34);

    /* And the control stays inside the chart, which is the thing the buttons could not do. */
    const control = container.querySelector(".sszvis-control-optionSelectable");
    expect(control).not.toBeNull();
    if (control === null) return;
    expect(control.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right,
    );
  });

  test("should keep the control clear of the plot", async () => {
    const container = await draw(findRecipeOrThrow("bar-chart-vertical"), controlled(), marks);

    const control = container.querySelector(".sszvis-control-optionSelectable");
    expect(control).not.toBeNull();
    if (control === null) return;

    /*
     * Against the tallest bar rather than the first one drawn. The bar that reaches
     * highest is the only one that can meet the control, so measuring any other leaves
     * slack the size of whatever that bar happens to be worth - enough to keep passing
     * with almost no headroom reserved at all.
     */
    const highest = Math.min(
      ...[...container.querySelectorAll("rect.sszvis-bar")].map(
        (bar) => bar.getBoundingClientRect().top,
      ),
    );
    expect(control.getBoundingClientRect().bottom).toBeLessThanOrEqual(highest);
  });
});

/*
 * A map drawn in a diverging palette, which is the one colour choice that changes more
 * than a name in the emitted source.
 *
 * The rest of the palettes swap one scale for another and read the domain the map has
 * always had. A diverging one brings a second domain, worked out in the chart's own
 * `init` from data no suite here ever sees - and every way of getting that domain wrong
 * type-checks. `[0, max]` puts the ramp's neutral middle at half the largest value;
 * `d3.extent` puts it wherever the data happens to be lopsided. Both emit a map, both
 * compile, and both tell the reader that areas are on a side of zero they are not on.
 *
 * So this reads the colours off the areas and holds them against the scale itself.
 */
describe("a map drawn in a diverging palette", () => {
  const PALETTE = "div-val-gry";

  /* Ten quarters with values on both sides of zero, so the ramp has two halves to use. */
  const CHANGE: readonly (readonly [code: string, name: string, value: number])[] = [
    ["111", "Affoltern", 5.2],
    ["091", "Albisrieden", -3.1],
    ["092", "Altstetten", 0.1],
    ["031", "Alt-Wiedikon", -1.8],
    ["014", "City", 2.4],
    ["024", "Enge", -0.4],
    ["052", "Escher Wyss", 4.6],
    ["071", "Fluntern", 0.9],
    ["033", "Friesenberg", -2.7],
    ["051", "Gewerbeschule", 3.3],
  ];

  /*
   * Lopsided on purpose. The largest rise is bigger than the deepest fall, so the domain
   * the chart should use - the larger extreme, mirrored - is not the one `d3.extent` would
   * give, and neither is `[0, max]`. A test on symmetric data could not tell the three apart.
   */
  const AMPLITUDE = 5.2;

  const csv = [
    "Qcode,Qname,Veränderung",
    ...CHANGE.map(([code, name, value]) => `${code},${name},${value}`),
  ].join("\n");

  const marks = {
    marks: ".sszvis-map__area:not(.sszvis-map__area--undefined)",
    count: CHANGE.length,
  };

  const diverging = (): Spec => {
    const recipe = findRecipeOrThrow("map-choropleth");
    const base = initialSpec(summarize(recipe), csv);
    return {
      ...base,
      /* Named rather than guessed: both numeric columns fit the value role. */
      fields: {
        ...base.fields,
        [GEO]: ColumnName.make("Qcode"),
        [GEO_LABEL]: ColumnName.make("Qname"),
        [VALUE]: ColumnName.make("Veränderung"),
      },
      options: { ...base.options, [OptionKey.make("palette")]: PALETTE },
      features: [FeatureKey.make("legend")],
    };
  };

  test("should shade every area as the palette does on a domain straddling zero", async () => {
    const container = await draw(findRecipeOrThrow("map-choropleth"), diverging(), marks);

    /*
     * The library's own scale is the oracle. Comparing against colours written down here
     * would prove only that two copies of the same guess agree; comparing against the scale
     * on the domain the chart should have chosen is the claim itself.
     */
    const ramp = sszvis.scaleDivValGry().domain([-AMPLITUDE, AMPLITUDE]);
    const expected = CHANGE.map(([, , value]) => String(ramp(value))).sort();

    const drawn = [...container.querySelectorAll(marks.marks)]
      .map((area) => area.getAttribute("fill") ?? "")
      .sort();

    expect(drawn).toEqual(expected);
  });

  /*
   * And the legend says so, which is the only place the reader can see the domain. Read
   * from the far side of the chart from the fills above, so a scale and a legend that
   * disagreed - the map coloured on one domain and explained on another - is still a
   * failure rather than two assertions making the same mistake together.
   */
  test("should key the ramp from one extreme to its mirror", async () => {
    const container = await draw(findRecipeOrThrow("map-choropleth"), diverging(), marks);

    const labels = [...container.querySelectorAll(".sszvis-legend__label")].map(
      (label) => label.textContent,
    );
    expect(labels).toEqual([sszvis.formatNumber(-AMPLITUDE), sszvis.formatNumber(AMPLITUDE)]);
  });

  /* The sequential default, on the same data, to show the second domain is the palette's
     doing rather than something the map now always does. */
  test("should leave the domain at zero when the palette does not diverge", async () => {
    const recipe = findRecipeOrThrow("map-choropleth");
    const spec = { ...diverging(), options: {} };
    const container = await draw(recipe, spec, marks);

    const labels = [...container.querySelectorAll(".sszvis-legend__label")].map(
      (label) => label.textContent,
    );
    expect(labels).toEqual([sszvis.formatNumber(0), sszvis.formatNumber(AMPLITUDE)]);
  });
});
