/* global page */

import glob from "glob";

const files = glob.sync("../docs/static/[^_]*/*.html", { cwd: __dirname });

describe("Visual regression tests", () => {
  test.each(files.map(filepathToUrl))("Snapshot of %s", async url => {
    try {
      await page.goto(url);
      const image = await page.screenshot();
      expect(image).toMatchImageSnapshot();
    } catch (e) {
      expect(e).toBeNull();
    }
  });
});

// -----------------------------------------------------------------------------

function filepathToUrl(path) {
  return path.replace(/(.*\/docs\/static)/, "http://localhost:8000");
}
