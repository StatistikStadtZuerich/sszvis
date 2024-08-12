import { globSync } from "glob";
import { test, expect } from "@playwright/test";

const RENDER_DELAY = 200;

const files = globSync("../../build/[^_]*/*.html", { cwd: __dirname });

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
  return path.replace(/(.*\/build)/, "http://localhost:8000");
}

function urlToIdentifier(url) {
  return url.replace("http://localhost:8000/", "").replace(".html", "").replace("/", "--");
}
