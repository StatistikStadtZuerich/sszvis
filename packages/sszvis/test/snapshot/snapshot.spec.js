import { expect, test } from "@playwright/test";
import { globSync } from "glob";

// Must exceed the library's longest transition
const RENDER_DELAY = 700;

// The docs site is built by the `@sszvis/docs` app; turbo runs its build first.
const DOCS_DIST = "../../../../apps/docs/dist";

const files = globSync(`${DOCS_DIST}/[^_]*/*.html`, { cwd: __dirname });

for (const url of files.map(filepathToUrl)) {
  test(url, async ({ page }) => {
    try {
      await page.goto(url);
      await page.waitForTimeout(RENDER_DELAY);
      await page.evaluate(() => {
        const elements = document.querySelectorAll(".sszvis-map__image");
        for (const element of elements) element.remove();
      });

      await expect(page).toHaveScreenshot(`${urlToIdentifier(url)}-0`);

      const buttons = await page.$$(".sszvis-control-buttonGroup__item:not(.selected)");

      for (const [button, idx] of buttons.map((b, i) => [b, i])) {
        await button.click();
        await page.waitForTimeout(RENDER_DELAY);
        await page.evaluate(() => {
          const elements = document.querySelectorAll(".sszvis-map__image");
          for (const element of elements) element.remove();
        });

        await expect(page).toHaveScreenshot(`${urlToIdentifier(url)}-${idx + 1}`);
      }
    } catch (error) {
      expect(error).toBeNull();
    }
  });
}

// -----------------------------------------------------------------------------

function filepathToUrl(path) {
  return path.replace(/^.*apps\/docs\/dist/, "http://localhost:8000");
}

function urlToIdentifier(url) {
  return url.replace("http://localhost:8000/", "").replace(".html", "").replace("/", "--");
}
