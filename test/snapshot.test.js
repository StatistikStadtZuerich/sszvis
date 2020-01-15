/* global page */

import glob from "glob";

const files = glob.sync("../docs/static/[^_]*/*.html", { cwd: __dirname });

test.each(files.map(filepathToUrl))("%s", async url => {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitFor(100);
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();
  } catch (e) {
    expect(e).toBeNull();
  }
});

// -----------------------------------------------------------------------------

function filepathToUrl(path) {
  return path.replace(/(.*\/docs\/static)/, "http://localhost:8000");
}
