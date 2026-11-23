var e={ts:{raw:`/**
 * Basic sunburst chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    sunburst
 * @features tooltip, legend
 * @date     2026-09-14
 */

// Magic Numbers

/** The continents in the order the rings should read, outermost segment first. */
const CONTINENT_ORDER = ["Europa", "Asien", "Amerika", "Afrika", "Ozeanien", "Unzuteilbar"];
/** The hierarchy has three key layers: continent, region, country. */
const NUM_LAYERS = 3;
/** Gap in px between the outer ring and the colour legend below it. */
const LEGEND_GUTTER = 20;

// Types

type Datum = {
  continent: string;
  region: string;
  country: string;
  number: number;
};

/**
 * Mirrors the library's \`NodeDatum\`: \`prepareHierarchyData\` wraps every row in this
 * discriminated union, but the type itself is not re-exported from the \`sszvis\` entry
 * point, so examples have to restate its shape.
 */
type HierarchyDatum =
  | { _tag: "root"; children: HierarchyDatum[] }
  | { _tag: "branch"; key: string; rootKey: string; children: HierarchyDatum[] }
  | { _tag: "leaf"; key: string; rootKey: string; data: Datum };

type TreeNode = import("d3").HierarchyNode<HierarchyDatum>;
/** A node once \`d3.partition\` has written its ring position onto it. */
type ArcNode = import("d3").HierarchyRectangularNode<HierarchyDatum>;

type State = {
  data: TreeNode;
  continents: string[];
  /** Domain of the radius scale, in the partition layout's own units. */
  radiusExtent: [number, number];
  selection: ArcNode[];
};

type Actions = {
  showTooltip: (state: State, e: Event, node: ArcNode) => void;
  hideTooltip: (state: State) => void;
};

// Accessors

const continentAcc = (d: Datum) => d.continent;
const regionAcc = (d: Datum) => d.region;
const countryAcc = (d: Datum) => d.country;
const numAcc = (d: Datum) => d.number;
const keyAcc = (d: HierarchyDatum) => ("key" in d ? d.key : "");

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        continent: d["kontinent"] ?? "",
        region: d["region"] ?? "",
        country: d["land"] ?? "",
        number: sszvis.parseNumber(d["anzahl"]),
      }))
      .then((data) => {
        // NOTE: The hierarchy keeps the input order, so sorting the rows first is what puts
        // the continents in the order above, and the countries within them by size.
        data.sort((a, b) => {
          const indexDiff = d3.ascending(
            CONTINENT_ORDER.indexOf(continentAcc(a)),
            CONTINENT_ORDER.indexOf(continentAcc(b)),
          );
          return indexDiff === 0 ? d3.descending(numAcc(a), numAcc(b)) : indexDiff;
        });

        const hierarchy = sszvis
          .prepareHierarchyData<Datum>()
          .layer(continentAcc)
          .layer(regionAcc)
          .layer(countryAcc)
          .value(numAcc)
          .calculate(data);

        // NOTE: Partitioning a copy gives the unit-square extent the sunburst component's
        // own partition will produce, without writing positions onto the state's nodes.
        const { y1, x1 } = d3.partition<HierarchyDatum>()(hierarchy.copy());

        state.data = hierarchy;
        state.continents = CONTINENT_ORDER;
        state.radiusExtent = [y1, x1];
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, node) {
      state.selection = [node];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const legendLayout = sszvis.colorLegendLayout({ legendLabels: state.continents }, config.id);

    const bounds = sszvis.bounds(
      { top: 20, right: 20, bottom: legendLayout.bottomPadding, left: 20 },
      config.id,
    );

    const burstLayout = sszvis.sunburstLayout(
      NUM_LAYERS,
      Math.min(bounds.innerWidth, bounds.innerHeight),
    );

    // Scales

    const colorScale = legendLayout.scale;

    const radiusScale = d3
      .scaleLinear()
      .domain(state.radiusExtent)
      .range([0, burstLayout.numLayers * burstLayout.ringWidth]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Zugezogene nach Herkunft",
        description: "Herkunft der Zugezogenen nach Kontinent, Region und Land.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    // NOTE: angleScale has a sensible default; configure it too if the geometry does not
    // come from sszvis.sunburstLayout.
    const sunburstMaker = sszvis
      .sunburst<Datum>()
      .fill(colorScale)
      .radiusScale(radiusScale)
      .centerRadius(burstLayout.centerRadius);

    const colorLegend = legendLayout.legend;

    const tooltipText = sszvis.modularTextHTML().bold((d: ArcNode) => keyAcc(d.data));

    const tooltip = sszvis
      .tooltip<ArcNode>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible((d) => sszvis.contains(state.selection, d))
      .header(tooltipText)
      .body((d) => sszvis.formatNumber(d.value));

    // Rendering

    const sunburstGroup = chartLayer
      .selectGroup("sunburst")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight / 2))
      .call(sunburstMaker);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(
          (bounds.innerWidth - legendLayout.legendWidth) / 2,
          bounds.innerHeight + LEGEND_GUTTER,
        ),
      )
      .call(colorLegend);

    sunburstGroup.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    const interactionLayer = sszvis
      .panning<ArcNode>()
      .elementSelector(".sszvis-sunburst-arc")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    sunburstGroup.call(interactionLayer);
  },
});
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Basic sunburst chart example using sszvis.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    sunburst</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip, legend</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> The continents in the order the rings should read, outermost segment first. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> CONTINENT_ORDER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Europa</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Asien</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Ozeanien</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Unzuteilbar</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> The hierarchy has three key layers: continent, region, country. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> NUM_LAYERS </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Gap in px between the outer ring and the colour legend below it. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_GUTTER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  continent</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  region</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  country</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  number</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Mirrors the library's \`NodeDatum\`: \`prepareHierarchyData\` wraps every row in this</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * discriminated union, but the type itself is not re-exported from the \`sszvis\` entry</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * point, so examples have to restate its shape.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> HierarchyDatum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  |</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _tag</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">root</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> children</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> HierarchyDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> }</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  |</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _tag</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">branch</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> key</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> rootKey</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> children</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> HierarchyDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> }</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  |</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _tag</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leaf</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> key</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> rootKey</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> TreeNode </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> import</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.HierarchyNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">HierarchyDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> A node once \`d3.partition\` has written its ring position onto it. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> ArcNode </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> import</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.HierarchyRectangularNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">HierarchyDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  data</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> TreeNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  continents</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  /**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Domain of the radius scale, in the partition layout's own units. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  radiusExtent</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  selection</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> ArcNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  showTooltip</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> e</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Event</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> node</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> ArcNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  hideTooltip</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> continentAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> regionAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">region</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> countryAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">country</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> numAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> keyAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> HierarchyDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">key</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> in</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">key </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        continent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">kontinent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        region</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">region</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        country</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">land</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">anzahl</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The hierarchy keeps the input order, so sorting the rows first is what puts</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> the continents in the order above, and the countries within them by size.</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sort</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">a</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> b</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">          const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> indexDiff </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ascending</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">            CONTINENT_ORDER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">indexOf</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">continentAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">a</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">            CONTINENT_ORDER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">indexOf</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">continentAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">b</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          );</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">          return</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> indexDiff </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">descending</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">numAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">a</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> numAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">b</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> indexDiff</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> hierarchy </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prepareHierarchyData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">layer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continentAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">layer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">regionAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">layer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">countryAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">numAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">calculate</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: Partitioning a copy gives the unit-square extent the sunburst component's</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> own partition will produce, without writing positions onto the state's nodes.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        const</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> y1</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> x1 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">}</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">partition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">HierarchyDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hierarchy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">copy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> hierarchy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continents </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> CONTINENT_ORDER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">radiusExtent </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">y1</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> x1</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> node</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">node</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">colorLegendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">({</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLabels</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continents </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottomPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> burstLayout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sunburstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      NUM_LAYERS</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">min</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> radiusScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">radiusExtent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> burstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">numLayers </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">*</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> burstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ringWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zugezogene nach Herkunft</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Herkunft der Zugezogenen nach Kontinent, Region und Land.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: angleScale has a sensible default; configure it too if the geometry does not</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> come from sszvis.sunburstLayout.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sunburstMaker </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sunburst</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">radiusScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">radiusScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">centerRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">burstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">centerRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorLegend </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipText </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> ArcNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> keyAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ArcNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fitTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipText</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">body</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sunburstGroup </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sunburst</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sunburstMaker</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legendWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">          bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_GUTTER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        ),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      )</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    sunburstGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">panning</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ArcNode</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">elementSelector</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.sszvis-sunburst-arc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">start</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pan</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    sunburstGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span></code></pre>`},js:{raw:`/**
 * Basic sunburst chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    sunburst
 * @features tooltip, legend
 * @date     2026-09-14
 */

// Magic Numbers

/** The continents in the order the rings should read, outermost segment first. */
const CONTINENT_ORDER = ["Europa", "Asien", "Amerika", "Afrika", "Ozeanien", "Unzuteilbar"];
/** The hierarchy has three key layers: continent, region, country. */
const NUM_LAYERS = 3;
/** Gap in px between the outer ring and the colour legend below it. */
const LEGEND_GUTTER = 20;

// Types

/**
 * Mirrors the library's \`NodeDatum\`: \`prepareHierarchyData\` wraps every row in this
 * discriminated union, but the type itself is not re-exported from the \`sszvis\` entry
 * point, so examples have to restate its shape.
 */

/** A node once \`d3.partition\` has written its ring position onto it. */

// Accessors

const continentAcc = (d) => d.continent;
const regionAcc = (d) => d.region;
const countryAcc = (d) => d.country;
const numAcc = (d) => d.number;
const keyAcc = (d) => ("key" in d ? d.key : "");

// Application

sszvis.app({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        continent: d["kontinent"] ?? "",
        region: d["region"] ?? "",
        country: d["land"] ?? "",
        number: sszvis.parseNumber(d["anzahl"]),
      }))
      .then((data) => {
        // NOTE: The hierarchy keeps the input order, so sorting the rows first is what puts
        // the continents in the order above, and the countries within them by size.
        data.sort((a, b) => {
          const indexDiff = d3.ascending(
            CONTINENT_ORDER.indexOf(continentAcc(a)),
            CONTINENT_ORDER.indexOf(continentAcc(b)),
          );
          return indexDiff === 0 ? d3.descending(numAcc(a), numAcc(b)) : indexDiff;
        });

        const hierarchy = sszvis
          .prepareHierarchyData()
          .layer(continentAcc)
          .layer(regionAcc)
          .layer(countryAcc)
          .value(numAcc)
          .calculate(data);

        // NOTE: Partitioning a copy gives the unit-square extent the sunburst component's
        // own partition will produce, without writing positions onto the state's nodes.
        const { y1, x1 } = d3.partition()(hierarchy.copy());

        state.data = hierarchy;
        state.continents = CONTINENT_ORDER;
        state.radiusExtent = [y1, x1];
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, node) {
      state.selection = [node];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const legendLayout = sszvis.colorLegendLayout({ legendLabels: state.continents }, config.id);

    const bounds = sszvis.bounds(
      { top: 20, right: 20, bottom: legendLayout.bottomPadding, left: 20 },
      config.id,
    );

    const burstLayout = sszvis.sunburstLayout(
      NUM_LAYERS,
      Math.min(bounds.innerWidth, bounds.innerHeight),
    );

    // Scales

    const colorScale = legendLayout.scale;

    const radiusScale = d3
      .scaleLinear()
      .domain(state.radiusExtent)
      .range([0, burstLayout.numLayers * burstLayout.ringWidth]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Zugezogene nach Herkunft",
        description: "Herkunft der Zugezogenen nach Kontinent, Region und Land.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    // NOTE: angleScale has a sensible default; configure it too if the geometry does not
    // come from sszvis.sunburstLayout.
    const sunburstMaker = sszvis
      .sunburst()
      .fill(colorScale)
      .radiusScale(radiusScale)
      .centerRadius(burstLayout.centerRadius);

    const colorLegend = legendLayout.legend;

    const tooltipText = sszvis.modularTextHTML().bold((d) => keyAcc(d.data));

    const tooltip = sszvis
      .tooltip()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible((d) => sszvis.contains(state.selection, d))
      .header(tooltipText)
      .body((d) => sszvis.formatNumber(d.value));

    // Rendering

    const sunburstGroup = chartLayer
      .selectGroup("sunburst")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight / 2))
      .call(sunburstMaker);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(
          (bounds.innerWidth - legendLayout.legendWidth) / 2,
          bounds.innerHeight + LEGEND_GUTTER,
        ),
      )
      .call(colorLegend);

    sunburstGroup.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    const interactionLayer = sszvis
      .panning()
      .elementSelector(".sszvis-sunburst-arc")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    sunburstGroup.call(interactionLayer);
  },
});`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Basic sunburst chart example using sszvis.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    sunburst</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip, legend</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> The continents in the order the rings should read, outermost segment first. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> CONTINENT_ORDER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Europa</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Asien</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Ozeanien</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Unzuteilbar</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> The hierarchy has three key layers: continent, region, country. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> NUM_LAYERS </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Gap in px between the outer ring and the colour legend below it. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_GUTTER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Mirrors the library's \`NodeDatum\`: \`prepareHierarchyData\` wraps every row in this</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * discriminated union, but the type itself is not re-exported from the \`sszvis\` entry</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * point, so examples have to restate its shape.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> A node once \`d3.partition\` has written its ring position onto it. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> continentAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> regionAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">region</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> countryAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">country</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> numAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> keyAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">key</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> in</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">key </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        continent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">kontinent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        region</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">region</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        country</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">land</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">anzahl</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The hierarchy keeps the input order, so sorting the rows first is what puts</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> the continents in the order above, and the countries within them by size.</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sort</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">a</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> b</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">          const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> indexDiff </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ascending</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">            CONTINENT_ORDER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">indexOf</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">continentAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">a</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">            CONTINENT_ORDER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">indexOf</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">continentAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">b</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          );</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">          return</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> indexDiff </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">descending</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">numAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">a</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> numAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">b</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> indexDiff</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        });</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> hierarchy </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prepareHierarchyData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">layer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continentAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">layer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">regionAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">layer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">countryAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">numAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">calculate</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: Partitioning a copy gives the unit-square extent the sunburst component's</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> own partition will produce, without writing positions onto the state's nodes.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        const</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> y1</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> x1 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">}</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">partition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hierarchy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">copy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> hierarchy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continents </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> CONTINENT_ORDER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">radiusExtent </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">y1</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> x1</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> node</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">node</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">colorLegendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">({</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLabels</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">continents </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottomPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> burstLayout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sunburstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      NUM_LAYERS</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">min</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> radiusScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">radiusExtent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> burstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">numLayers </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">*</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> burstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ringWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zugezogene nach Herkunft</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Herkunft der Zugezogenen nach Kontinent, Region und Land.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: angleScale has a sensible default; configure it too if the geometry does not</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> come from sszvis.sunburstLayout.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sunburstMaker </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sunburst</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">radiusScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">radiusScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">centerRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">burstLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">centerRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorLegend </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipText </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> keyAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fitTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipText</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">body</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sunburstGroup </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sunburst</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sunburstMaker</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">          (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legendWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">          bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_GUTTER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        ),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      )</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    sunburstGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">panning</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">elementSelector</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.sszvis-sunburst-arc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">start</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pan</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    sunburstGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span></code></pre>`},csv:{raw:`kontinent,region,land,anzahl
Afrika,Nordafrika,Algerien,242
Afrika,Nordafrika,Libyen,48
Afrika,Nordafrika,Marokko,338
Afrika,Nordafrika,Mauretanien,1
Afrika,Nordafrika,Sudan,49
Afrika,Nordafrika,Tunesien,339
Afrika,Nordafrika,Ägypten,195
Afrika,Ostafrika,Eritrea,1286
Afrika,Ostafrika,Kenia,96
Afrika,Ostafrika,Seychellen,2
Afrika,Ostafrika,Somalia,920
Afrika,Ostafrika,Tansania,18
Afrika,Ostafrika,Äthiopien,180
Afrika,Südafrika,Lesotho,1
Afrika,Südafrika,Sambia,2
Afrika,Südafrika,Simbabwe,15
Afrika,Südafrika,Südafrika,119
Afrika,Südostafrika,Komoren,5
Afrika,Südostafrika,Madagaskar,4
Afrika,Südostafrika,Malawi,1
Afrika,Südostafrika,Mauritius,6
Afrika,Südostafrika,Mosambik,4
Afrika,Südwestafrika,Angola,220
Afrika,Südwestafrika,Namibia,5
Afrika,Westafrika,Benin,1
Afrika,Westafrika,Burkina Faso,5
Afrika,Westafrika,Côte d'Ivoire,87
Afrika,Westafrika,Gabun,1
Afrika,Westafrika,Gambia,82
Afrika,Westafrika,Ghana,251
Afrika,Westafrika,Guinea,34
Afrika,Westafrika,Guinea-Bissau,3
Afrika,Westafrika,Kamerun,174
Afrika,Westafrika,Kap Verde,3
Afrika,Westafrika,Kongo (Brazzaville),76
Afrika,Westafrika,Liberia,19
Afrika,Westafrika,Mali,11
Afrika,Westafrika,Niger,2
Afrika,Westafrika,Nigeria,217
Afrika,Westafrika,Senegal,63
Afrika,Westafrika,Sierra Leone,13
Afrika,Westafrika,Togo,41
Afrika,Zentralafrika,Burundi,2
Afrika,Zentralafrika,Kongo (Kinshasa),161
Afrika,Zentralafrika,Ruanda,10
Afrika,Zentralafrika,Tschad,3
Afrika,Zentralafrika,Uganda,17
Afrika,Zentralafrika,Zentralafrikanische Republik,4
Amerika,Karibik,Antigua und Barbuda,1
Amerika,Karibik,Bahamas,2
Amerika,Karibik,Barbados,3
Amerika,Karibik,Dominica,1
Amerika,Karibik,Dominikanische Republik,794
Amerika,Karibik,Grenada,2
Amerika,Karibik,Haiti,28
Amerika,Karibik,Jamaika,75
Amerika,Karibik,Kuba,170
Amerika,Karibik,St. Kitts und Nevis,3
Amerika,Karibik,St. Lucia,2`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">kontinent,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">region,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">land,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">anzahl</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Algerien,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">242</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Libyen,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">48</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Marokko,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">338</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Mauretanien,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Sudan,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">49</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Tunesien,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">339</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Nordafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Ägypten,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">195</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Ostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Eritrea,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1286</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Ostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Kenia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">96</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Ostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Seychellen,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Ostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Somalia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">920</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Ostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Tansania,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">18</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Ostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Äthiopien,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">180</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Lesotho,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Sambia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Simbabwe,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">15</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Südafrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">119</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Komoren,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">5</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Madagaskar,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">4</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Malawi,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Mauritius,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">6</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südostafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Mosambik,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">4</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südwestafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Angola,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">220</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Südwestafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Namibia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">5</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Benin,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Burkina Faso,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">5</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Côte d'Ivoire,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">87</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Gabun,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Gambia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">82</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Ghana,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">251</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Guinea,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">34</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Guinea-Bissau,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">3</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Kamerun,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">174</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Kap Verde,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">3</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Kongo (Brazzaville),</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">76</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Liberia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">19</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Mali,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">11</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Niger,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Nigeria,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">217</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Senegal,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">63</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Sierra Leone,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">13</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Westafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Togo,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">41</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zentralafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Burundi,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zentralafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Kongo (Kinshasa),</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">161</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zentralafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Ruanda,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">10</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zentralafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Tschad,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">3</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zentralafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Uganda,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">17</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Afrika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zentralafrika,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Zentralafrikanische Republik,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">4</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Antigua und Barbuda,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Bahamas,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Barbados,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">3</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Dominica,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Dominikanische Republik,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">794</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Grenada,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Haiti,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">28</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Jamaika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">75</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">Kuba,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">170</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">St. Kitts und Nevis,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">3</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Amerika,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Karibik,</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">St. Lucia,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2</span></span></code></pre>`,lines:176,url:`/sszvis/preview/sunburst/basic/data.csv`}};export{e as default};