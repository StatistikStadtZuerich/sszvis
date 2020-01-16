/* global page */

import glob from "glob";

const RENDER_DELAY = 200;
const SNAPSHOT_OPTS = {
  failureThreshold: 10,
  failureThresholdType: "pixel"
};

const files = glob.sync("../docs/static/[^_]*/*.html", { cwd: __dirname });

test.each(files.map(filepathToUrl))("%s", async url => {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitFor(RENDER_DELAY);
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot(SNAPSHOT_OPTS);

    const buttons = await page.$$(".sszvis-control-buttonGroup__item:not(.selected)");

    for (const button of buttons) {
      await button.click();
      await page.waitFor(RENDER_DELAY);

      const stateImage = await page.screenshot();
      expect(stateImage).toMatchImageSnapshot(SNAPSHOT_OPTS);
    }
  } catch (e) {
    expect(e).toBeNull();
  }
});

// -----------------------------------------------------------------------------

function filepathToUrl(path) {
  return path.replace(/(.*\/docs\/static)/, "http://localhost:8000");
}
