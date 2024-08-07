/* global page */

import glob from "glob";

const RENDER_DELAY = 200;

const buildSnapshotOptions = (threshold) => ({
  failureThreshold: threshold,
  failureThresholdType: "percent",
  customSnapshotIdentifier: ({ currentTestName, counter }) =>
    `${urlToIdentifier(currentTestName)}-${counter}`,
});

const files = glob.sync("../build/[^_]*/*.html", { cwd: __dirname });

test.each(files.map(filepathToUrl))("%s", async (url) => {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(RENDER_DELAY);
    await page.evaluate(() => {
      const elements = document.querySelectorAll(".sszvis-map__image");
      elements.forEach((element) => element.remove());
    });
    const image = await page.screenshot();
    const threshold = process.env.CI ? 0.1 : 0.05;
    expect(image).toMatchImageSnapshot(buildSnapshotOptions(threshold));

    const buttons = await page.$$(".sszvis-control-buttonGroup__item:not(.selected)");

    for (const button of buttons) {
      await button.click();
      await page.waitForTimeout(RENDER_DELAY);
      await page.evaluate(() => {
        const elements = document.querySelectorAll(".sszvis-map__image");
        elements.forEach((element) => element.remove());
      });

      const stateImage = await page.screenshot();
      expect(stateImage).toMatchImageSnapshot(buildSnapshotOptions(threshold));
    }
  } catch (e) {
    expect(e).toBeNull();
  }
});

// -----------------------------------------------------------------------------

function filepathToUrl(path) {
  return path.replace(/(.*\/build)/, "http://localhost:8000");
}

function urlToIdentifier(url) {
  return url.replace("http://localhost:8000/", "").replace(".html", "").replace("/", "--");
}
