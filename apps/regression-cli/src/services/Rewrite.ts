/**
 * Rewriting a chart page to point at one side's library, and the reporter that
 * is injected into every page.
 *
 * `serve` uses these to answer requests, `export` to write a static copy. They
 * live together so the two cannot drift: a rewrite the server does and the
 * export does not would make the shared build and the shipped one different
 * comparisons. Which *file* a rewritten URL resolves to is `Workspace.lib`.
 */
import type { Side } from "../domain/Chart.ts";

/** Files a chart page loads from its pinned library folder. */
export const LIB_FILES = ["sszvis.js", "sszvis.min.js", "sszvis.css", "d3.js", "topojson.js"];

/**
 * The reference pages hardcode absolute library URLs:
 * `http://sszsttprd/.../library_script/3.4.0/sszvis.js`.
 */
export const LIB_REF = /https?:\/\/[^"'\s]*?library_script\/(\d+\.\d+\.\d+)\//g;

/**
 * Injected into every page. Collects `window.onerror`, unhandled rejections and
 * `console.error`, counts rendered SVGs and the data marks inside them, and
 * posts the result to the parent frame - `serve`'s comparison page listens for
 * that, while `crawl` calls the exposed `window.__sszvisRegression()`.
 */
const reporter = (side: Side, chartPath: string): string => `<script>
(function(){
  var errors = [];
  // A chart that draws its frame but no marks is the failure svgCount cannot
  // see: d3's .data() over a non-iterable joins nothing, silently.
  var MARKS = "rect,path,circle,line,polygon,ellipse";
  // Chrome sszvis draws whether or not data arrived, and so must not keep an
  // empty chart's mark count above zero - the failure "renders-empty" looks for.
  //
  // Matched two ways: by class substring, case-insensitively, because both
  // suffix and stem vary ("sszvis-legend--entry", "sszvis-rangeRuler__rule");
  // and by data attribute, because behavior/move and annotation/tooltipAnchor
  // draw rects with no class at all.
  //
  // XXX: Only elements a behavior *creates* belong here. behavior/panning
  // decorates marks the chart already drew - a choropleth's own map areas carry
  // [data-sszvis-behavior-pannable] and class "sszvis-interactive" - so adding
  // either would delete real data marks instead of chrome.
  var CHROME = ["defs"]
    .concat(
      // Axes, legends, rulers, tooltips, controls, and the map's border and lake
      // paths - base geometry that comes from the topology, not the data.
      ["axis", "legend", "ruler", "tooltip", "control", "map__border", "map__lake"]
        .map(function(part){ return '[class*="sszvis-' + part + '" i]'; })
    )
    .concat(
      // src/behavior/*, annotation/tooltipAnchor, with debug twins where they exist.
      ["data-sszvis-behavior-move", "data-sszvis-behavior-voronoi",
       "data-tooltip-anchor", "data-tooltip-anchor-debug"]
        .map(function(attr){ return "[" + attr + "]"; })
    )
    .join(",");
  function countMarks(){
    var nodes = document.querySelectorAll("svg " + MARKS.split(",").join(",svg "));
    var n = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].closest || !nodes[i].closest(CHROME)) n++;
    }
    return n;
  }
  var meta = { side: ${JSON.stringify(side)}, path: ${JSON.stringify(chartPath)} };
  var resources = [];
  function snapshot(){
    return {
      type: "sszvis-regression",
      side: meta.side,
      path: meta.path,
      errors: errors.slice(0, 20),
      errorCount: errors.length,
      resources: resources.slice(0, 20),
      resourceCount: resources.length,
      svgCount: document.querySelectorAll("svg").length,
      markCount: countMarks(),
      height: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)
    };
  }
  // Exposed for the headless crawler; the comparison page uses postMessage.
  window.__sszvisRegression = snapshot;
  function report(){ try { parent.postMessage(snapshot(), "*"); } catch (e) {} }
  window.addEventListener("error", function(e){
    // The capture phase also sees a failed <link>/<script>/<img>, as an Event on
    // the element rather than an ErrorEvent (stringifying gives "[object Event]").
    // Worth reporting, but not a script fault: it must stay out of the error
    // totals the two sides are compared on.
    if (e.target && e.target !== window && e.target.tagName) {
      var url = e.target.src || e.target.href || "";
      resources.push(e.target.tagName.toLowerCase() + " failed to load: " + url);
    } else {
      errors.push(String((e.error && e.error.stack) || e.message || e));
    }
    report();
  }, true);
  window.addEventListener("unhandledrejection", function(e){
    errors.push("unhandled rejection: " + String(e.reason));
    report();
  });
  var nativeError = console.error;
  console.error = function(){
    errors.push(Array.prototype.map.call(arguments, String).join(" "));
    nativeError.apply(console, arguments);
    report();
  };
  window.addEventListener("load", function(){
    report();
    // Chart data is fetched asynchronously, so re-report as rendering settles.
    setTimeout(report, 800);
    setTimeout(report, 2500);
    setTimeout(report, 5000);
  });
})();
</script>`;

/**
 * `libPrefix` is where this copy of the page should look for the libraries.
 * `serve` answers absolute `/lib/...` paths; a static export has no server to
 * resolve those, so it passes a `../..`-style path back to its own root.
 */
export const rewriteChart = (
  html: string,
  side: Side,
  chartPath: string,
  libPrefix = "/lib/",
): string => {
  let out = html.replace(LIB_REF, (_match, version: string) => `${libPrefix}${side}/${version}/`);
  const script = reporter(side, chartPath);
  if (/<head[^>]*>/i.test(out)) return out.replace(/<head[^>]*>/i, (m) => m + script);
  if (/<body[^>]*>/i.test(out)) return out.replace(/<body[^>]*>/i, (m) => m + script);
  return script + out;
};
