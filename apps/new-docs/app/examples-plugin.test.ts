import http from "node:http";

import { createServer } from "vite";
import { expect, test } from "vitest";

import { examplesPlugin } from "../vite-plugin-examples";

const PAGE = "/sszvis/preview/map-extended/topolayer-stadtkreise";

/*
 * An example loads its shared files by relative path (`../../_static/`), which resolves
 * only from the directory URL. The dev server must send a slashless URL there first, as
 * a static host does, or the map's topology and fallback are fetched one level too high.
 */
test("should redirect an example's slashless URL to the directory, keeping the query", async () => {
  const vite = await createServer({
    configFile: false,
    root: process.cwd(),
    base: "/sszvis/",
    logLevel: "silent",
    server: { middlewareMode: true },
    plugins: [examplesPlugin()],
  });
  const server = http.createServer(vite.middlewares);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const origin = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
  try {
    const bare = await fetch(`${origin}${PAGE}?x=1`, { redirect: "manual" });
    expect(bare.status).toBe(302);
    expect(bare.headers.get("location")).toBe(`${PAGE}/?x=1`);

    const page = await fetch(`${origin}${PAGE}/`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("../../_static/");
  } finally {
    server.close();
    await vite.close();
  }
}, 60_000);
