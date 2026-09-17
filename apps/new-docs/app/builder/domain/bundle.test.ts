import { describe, expect, test } from "vitest";

import { bundleEntries, MissingAssetError } from "./bundle";
import type { Asset } from "./spec";

const GENERATED = { html: "<html></html>", js: "// chart", csv: "a,b\n1,2" };
const TOPO: Asset = { key: "topology", path: "topo.json", source: "/app/topo/stadt-zurich.json" };

const reply = (body: string, ok = true) =>
  Promise.resolve({
    ok,
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(body).buffer),
  });

const names = (entries: readonly { readonly name: string }[]) => entries.map((entry) => entry.name);

describe("bundleEntries", () => {
  test("should hold the three sources and the fallback when a chart loads nothing else", async () => {
    const entries = await bundleEntries(GENERATED, [], "/fallback.png", (() =>
      reply("png")) as unknown as typeof fetch);
    expect(names(entries)).toEqual(["index.html", "chart.js", "data.csv", "fallback.png"]);
  });

  test("should carry a chart's second file under the name its config gives it", async () => {
    /*
     * The whole point of the bundle for a map: the geometry is published nowhere the
     * export could link to, so an archive without it is a chart that cannot draw.
     */
    const read = ((url: string) =>
      reply(url.endsWith(".json") ? '{"objects":{}}' : "png")) as unknown as typeof fetch;
    const entries = await bundleEntries(GENERATED, [TOPO], "/fallback.png", read);
    expect(names(entries)).toContain("topo.json");
    const topo = entries.find((entry) => entry.name === "topo.json");
    expect(new TextDecoder().decode(topo?.content)).toBe('{"objects":{}}');
  });

  test("should refuse the archive rather than ship an error page as the geometry", async () => {
    /*
     * A 404 is a perfectly good response carrying HTML, which would otherwise be the
     * geometry. Dropping it instead would hand back an archive whose index.html still
     * names topo.json - a chart guaranteed to fail the moment it is opened - so the
     * download fails here, where it can still be reported.
     */
    const read = ((url: string) =>
      reply("<!doctype html>not found", !url.endsWith(".json"))) as unknown as typeof fetch;
    await expect(bundleEntries(GENERATED, [TOPO], "/fallback.png", read)).rejects.toThrow(
      MissingAssetError,
    );
  });

  test("should name every asset it could not read", async () => {
    const read = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
    await expect(bundleEntries(GENERATED, [TOPO], "/fallback.png", read)).rejects.toThrow(
      /topo\.json/,
    );
  });

  test("should still build the archive when only the fallback image is missing", async () => {
    /* The fallback is decoration: a chart without it still draws, so it stays optional. */
    const read = ((url: string) =>
      reply(
        url.endsWith(".json") ? '{"objects":{}}' : "",
        !url.endsWith(".png"),
      )) as unknown as typeof fetch;
    const entries = await bundleEntries(GENERATED, [TOPO], "/fallback.png", read);
    expect(names(entries)).toEqual(["index.html", "chart.js", "data.csv", "topo.json"]);
  });
});
