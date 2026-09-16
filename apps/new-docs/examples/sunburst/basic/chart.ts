/**
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
 * Mirrors the library's `NodeDatum`: `prepareHierarchyData` wraps every row in this
 * discriminated union, but the type itself is not re-exported from the `sszvis` entry
 * point, so examples have to restate its shape.
 */
type HierarchyDatum =
  | { _tag: "root"; children: HierarchyDatum[] }
  | { _tag: "branch"; key: string; rootKey: string; children: HierarchyDatum[] }
  | { _tag: "leaf"; key: string; rootKey: string; data: Datum };

type TreeNode = import("d3").HierarchyNode<HierarchyDatum>;
/** A node once `d3.partition` has written its ring position onto it. */
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
