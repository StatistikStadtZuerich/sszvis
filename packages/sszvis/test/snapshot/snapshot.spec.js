import { expect, test } from "@playwright/test";
import { globSync } from "glob";

// Must exceed the library's longest transition
const RENDER_DELAY = 700;

// The docs site is built by the `@sszvis/docs` app; turbo runs its build first.
const DOCS_DIST = "../../../../apps/docs/dist";
const BASE_URL = process.env.SNAPSHOT_BASE_URL || "http://localhost:8000";

const files = globSync(`${DOCS_DIST}/[^_]*/*.html`, { cwd: __dirname });

/*
 * The suite's size comes from the docs output, so a stale or half-built dist
 * silently shrinks it - an empty glob would report zero tests and pass.
 */
test("the docs build produced pages to screenshot", () => {
  expect(files.length).toBeGreaterThan(50);
});

for (const url of files.map(filepathToUrl)) {
  test(url, async ({ page }) => {
    await page.goto(url);
    await page.waitForTimeout(RENDER_DELAY);
    await removeMapImages(page);

    await expect(page).toHaveScreenshot(`${urlToIdentifier(url)}-0`);

    const buttons = await page.$$(".sszvis-control-buttonGroup__item:not(.selected)");

    for (const [idx, button] of buttons.entries()) {
      await button.click();
      await page.waitForTimeout(RENDER_DELAY);
      await removeMapImages(page);

      await expect(page).toHaveScreenshot(`${urlToIdentifier(url)}-${idx + 1}`);
    }
  });
}

// -----------------------------------------------------------------------------

/** Raster map tiles load over the network and would make screenshots flaky. */
function removeMapImages(page) {
  return page.evaluate(() => {
    for (const element of document.querySelectorAll(".sszvis-map__image")) element.remove();
  });
}

function filepathToUrl(path) {
  return path.replace(/^.*apps\/docs\/dist/, BASE_URL);
}

function urlToIdentifier(url) {
  return url.replace(`${BASE_URL}/`, "").replace(".html", "").replace("/", "--");
}
