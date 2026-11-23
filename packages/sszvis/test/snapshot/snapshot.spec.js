import { expect, test } from "@playwright/test";
import { globSync } from "glob";

// Must exceed the library's longest transition
const RENDER_DELAY = 700;

// The docs site builds every example as a standalone page at /preview/<chart>/<name>/;
// turbo runs its build first. Kept in sync with playwright.config.js.
const PREVIEW_DIR = "../../../../apps/new-docs/build/client/preview";
const BASE_URL = process.env.SNAPSHOT_BASE_URL || "http://localhost:4173";

// `_assets` and `_static` hold the library and shared files, not examples.
const ids = globSync("[^_]*/[^_]*/index.html", { cwd: `${__dirname}/${PREVIEW_DIR}` })
  .map((file) => file.replace(/\/index\.html$/, ""))
  .sort();

/*
 * The suite's size comes from the docs output, so a stale or half-built dist
 * silently shrinks it - an empty glob would report zero tests and pass.
 */
test("the docs build produced pages to screenshot", () => {
  expect(ids.length).toBeGreaterThan(50);
});

for (const id of ids) {
  const name = id.replace("/", "--");
  test(id, async ({ page }) => {
    await page.goto(`${BASE_URL}/preview/${id}/`);
    await page.waitForTimeout(RENDER_DELAY);
    await removeMapImages(page);

    await expect(page).toHaveScreenshot(`${name}-0`);
    await expectMapLayers(page, `${name}-0`);

    const buttons = await page.$$(".sszvis-control-buttonGroup__item:not(.selected)");

    for (const [idx, button] of buttons.entries()) {
      await button.click();
      await page.waitForTimeout(RENDER_DELAY);
      await removeMapImages(page);

      await expect(page).toHaveScreenshot(`${name}-${idx + 1}`);
      await expectMapLayers(page, `${name}-${idx + 1}`);
    }
  });
}

// -----------------------------------------------------------------------------

/** Removes the topographic background images that sit underneath some maps. */
function removeMapImages(page) {
  return page.evaluate(() => {
    for (const element of document.querySelectorAll(".sszvis-map__image")) element.remove();
  });
}

/*
 * A screenshot cannot tell whether a map layer is painting its data. The
 * missing-value texture is a light grey hatch, and every pixel of it falls
 * inside the comparator's per-pixel colour tolerance, so a map that textures
 * all 34 of its districts moves the diff by about 15 pixels - less than font
 * rendering differs between machines. Record what each map layer paints
 * instead, as text: it is exact, and the same on every platform and browser.
 */
async function expectMapLayers(page, name) {
  const layers = await page.evaluate(() =>
    // The two renderers that paint the missing-value texture; a layer is the
    // group a renderer joins its elements into.
    Object.entries({ area: ".sszvis-map__area", geojson: ".sszvis-map__geojsonelement" }).flatMap(
      ([kind, selector]) => {
        const byLayer = new Map();
        for (const element of document.querySelectorAll(selector)) {
          const fills = byLayer.get(element.parentElement) ?? [];
          fills.push(element.getAttribute("fill") ?? "");
          byLayer.set(element.parentElement, fills);
        }
        return [...byLayer.values()].map((fills, i) => {
          const textured = fills.filter((fill) => fill.startsWith("url(#missing-pattern")).length;
          const colours = new Set(fills.filter((fill) => !fill.startsWith("url(")));
          return `${kind} layer ${i + 1}: ${fills.length} elements, ${textured} textured, ${colours.size} distinct fills`;
        });
      },
    ),
  );
  if (layers.length === 0) return;

  expect(`${layers.join("\n")}\n`).toMatchSnapshot(`${name}.map.txt`);
}
