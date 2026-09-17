import { Effect } from "effect";
import * as d3 from "d3";
import * as sszvis from "sszvis";
import tsBlankSpace from "ts-blank-space";
import { afterEach, describe, expect, test } from "vitest";

import { compile } from "./domain/compile";
import { initialSpec } from "./domain/initial-spec";
import { recipes } from "./domain/recipes";
import { summarize, type Recipe, type Spec } from "./domain/spec";

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
  /* `zu-und-wegzuege` splits five dates into two series, so two lines. */
  "line-chart": { marks: "path.sszvis-line", count: 2 },
};

/**
 * Waits for the app's render loop to have painted.
 *
 * `sszvis.app` renders on an animation frame, and its `init` awaits a fetch first, so a
 * test that asserts straight after mounting sees an empty container every time. A
 * macrotask lets the fetch settle; two frames after it is the first tick at which marks
 * exist.
 */
const painted = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
  });
};

/** Runs a recipe's emitted chart in a container of its own and hands back that container. */
const draw = async (recipe: Recipe, spec: Spec): Promise<HTMLElement> => {
  const ts = Effect.runSync(compile(recipe, spec));
  const js = tsBlankSpace(ts);

  const container = document.createElement("div");
  container.id = `chart-${recipe.key}`;
  container.style.width = `${WIDTH}px`;
  document.body.append(container);

  const config = { data: csvUrl(spec.csv), id: `#${container.id}`, fallback: "" };
  /*
   * The emitted file is a script, not a module: it reads `d3`, `sszvis` and `config` as
   * globals, exactly as the generated index.html supplies them. Running it through
   * `new Function` rather than an import is what keeps this the real artefact.
   */
  new Function("d3", "sszvis", "config", js)(d3, sszvis, config);

  await painted();
  return container;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("generated charts", () => {
  for (const recipe of recipes) {
    test(`should draw every mark of its sample for ${recipe.key}`, async () => {
      const expected = EXPECTED[recipe.key];
      expect(expected, `no expected mark count for the recipe "${recipe.key}"`).toBeDefined();
      if (expected === undefined) return;

      const container = await draw(recipe, initialSpec(summarize(recipe)));

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
