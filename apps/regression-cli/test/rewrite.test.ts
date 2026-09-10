/**
 * The URL rewrite and reporter injection, which is the mechanism the whole
 * comparison rests on: get it wrong and both sides silently load the same
 * library.
 *
 * The `<body>` and prepend cases are covered deliberately even though every one
 * of the 1077 pages in the reference checkout has a `<head>` - they are the
 * fallbacks for a page shape the corpus does not currently contain, so nothing
 * else would notice if they broke.
 */
import { describe, expect, it } from "vitest";
import { LIB_REF, rewriteChart } from "../src/services/Rewrite.ts";

const page = (head: string) =>
  `<html><head>${head}</head><body><div id="chart"></div></body></html>`;

const pinned =
  '<script src="http://sszsttprd/statisticstools/Modules/StyleGuide/projects/library_script/3.4.0/sszvis.js"></script>';

describe("rewriteChart", () => {
  it("points a pinned library URL at the requested side", () => {
    const out = rewriteChart(page(pinned), "candidate", "a/b.html");
    expect(out).toContain('src="/lib/candidate/3.4.0/sszvis.js"');
    expect(out).not.toContain("sszsttprd");
  });

  it("keeps the pinned version in the rewritten path", () => {
    const older = pinned.replace("3.4.0", "3.2.1");
    expect(rewriteChart(page(older), "baseline", "a/b.html")).toContain(
      'src="/lib/baseline/3.2.1/sszvis.js"',
    );
  });

  it("rewrites every library URL on the page, not just the first", () => {
    const many = [pinned, pinned.replace("sszvis.js", "d3.js")].join("");
    const out = rewriteChart(page(many), "baseline", "a/b.html");
    expect(out).toContain("/lib/baseline/3.4.0/sszvis.js");
    expect(out).toContain("/lib/baseline/3.4.0/d3.js");
  });

  it("resolves against a relative prefix so a static export needs no server", () => {
    const out = rewriteChart(page(pinned), "candidate", "a/b.html", "../../lib/");
    expect(out).toContain('src="../../lib/candidate/3.4.0/sszvis.js"');
  });

  it("injects the reporter and tells it which side and page it is on", () => {
    const out = rewriteChart(page(pinned), "candidate", "deep/chart.html");
    expect(out).toContain("window.__sszvisRegression");
    expect(out).toContain('"candidate"');
    expect(out).toContain('"deep/chart.html"');
  });

  it("injects the reporter exactly once", () => {
    const out = rewriteChart(page(pinned), "baseline", "a/b.html");
    expect(out.split("window.__sszvisRegression = snapshot").length - 1).toBe(1);
  });

  it("injects into <head> when there is one", () => {
    const out = rewriteChart(page(pinned), "baseline", "a/b.html");
    // Before the page's own scripts, so it can catch their errors.
    expect(out.indexOf("__sszvisRegression")).toBeLessThan(out.indexOf("/lib/baseline"));
  });

  it("falls back to <body> for a page with no head", () => {
    const out = rewriteChart(`<html><body>${pinned}</body></html>`, "baseline", "a/b.html");
    // Inside the body, not prepended ahead of the document: the prepend branch
    // would also satisfy "contains the reporter", so assert the position.
    expect(out.startsWith("<html><body><script>")).toBe(true);
    expect(out.indexOf("__sszvisRegression")).toBeLessThan(out.indexOf("/lib/baseline"));
  });

  it("prepends the reporter for a fragment with neither head nor body", () => {
    const out = rewriteChart(pinned, "baseline", "a/b.html");
    expect(out.startsWith("<script>")).toBe(true);
    expect(out).toContain("/lib/baseline/3.4.0/sszvis.js");
  });

  it("leaves a page with no pinned library alone apart from the reporter", () => {
    const out = rewriteChart(page("<title>x</title>"), "baseline", "a/b.html");
    expect(out).toContain("<title>x</title>");
    expect(out).toContain("__sszvisRegression");
    expect(out).not.toContain("/lib/");
  });
});

describe("LIB_REF", () => {
  it("does not carry lastIndex between uses despite being a global regex", () => {
    // It is module-level and shared by the manifest scan and the rewrite, so a
    // retained lastIndex would make it skip pages.
    const html = page(pinned);
    expect([...html.matchAll(LIB_REF)].length).toBe(1);
    expect([...html.matchAll(LIB_REF)].length).toBe(1);
    expect(LIB_REF.lastIndex).toBe(0);
  });
});
