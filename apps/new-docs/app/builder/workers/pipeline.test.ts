import { Effect } from "effect";
import { describe, expect, test } from "vitest";

import { initialSpec } from "@sszvis/chart-builder/initial-spec";
import { findRecipe } from "@sszvis/chart-builder/recipes";
import { sampleFor } from "@sszvis/chart-builder/samples";
import { summarize } from "@sszvis/chart-builder/spec";
import { generate } from "./pipeline";

describe("highlighting", () => {
  test("should highlight every file when the pipeline runs", async () => {
    const entry = Effect.runSync(findRecipe("bar-chart-vertical"));
    const generated = await generate(entry, { ...initialSpec(summarize(entry)), features: [] });
    for (const key of ["ts", "js", "html", "csv"] as const) {
      const { raw, html } = generated[key];
      /* `defaultColor: false`: a variable per theme, no inline colour to fight the page's.
         The variables are the decision; the wrapper's class list is shiki's to spell. */
      expect(html, key).toContain("--shiki-light:");
      expect(html, key).toContain("--shiki-dark:");
      expect(raw.length, key).toBeGreaterThan(0);
    }
    expect(generated.csv.raw).toBe(sampleFor(entry.sample).csv);
    expect(generated.html.raw).toMatch(/^<!doctype html>/);
  });
});
