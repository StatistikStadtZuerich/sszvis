/**
 * Choropleth map of the Zurich agglomeration, with a class-based colour legend.
 *
 * @category map-standard
 */

// Magic Numbers

/** Vertical padding in px above the map. */
const TOP_PADDING = 10;
/** Vertical padding in px below the map, which holds the legend. */
const BOTTOM_PADDING = 64;
/** Gap in px between the bottom of the map and the legend. */
const LEGEND_GUTTER = 20;
const LEGEND_COLUMNS = 3;
/** Cap on a legend column's width in px. */
const MAX_LEGEND_COLUMN_WIDTH = 100;
const TOPO_URL = "/preview/_static/topo/agglomeration-zurich.json";

// Types

type Datum = {
  geoId: number;
  name: string;
  category: string;
  value: number;
};

/**
 * What the map binds to each area and to each tooltip anchor: the feature paired
 * with the datum that was matched to it. The pairing is what lets the tooltip be
 * positioned from the geometry, and it is why reading a value means going through
 * `.datum` rather than treating the bound object as the datum itself.
 */
type MapDatum = import("sszvis").MergedGeoDatum<Datum>;

/** One entry of the legend: a class, and the value its colour is taken from. */
type Category = {
  name: string;
  value: number;
};

type MapData = {
  features: import("d3").ExtendedFeatureCollection;
  borders: import("d3").GeoPermissibleObjects;
  lakeFeatures: import("d3").GeoPermissibleObjects;
};

type State = {
  data: Datum[];
  mapData: MapData;
  selection: Datum[];
  valueDomain: [number, number];
  categories: Category[];
};

type Actions = {
  selectHovered: (state: State, e: Event, d: MapDatum) => void;
  deselectHovered: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("bounds", {
  _: (width) => {
    const innerHeight = sszvis.aspectRatioPortrait(width);
    return {
      top: TOP_PADDING,
      bottom: BOTTOM_PADDING,
      height: TOP_PADDING + innerHeight + BOTTOM_PADDING,
    };
  },
});

// Accessors

const vAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.category;
const nameAcc = (d: Datum) => d.name;
const catName = (c: Category) => c.name;
const catValue = (c: Category) => c.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; `app()` renders nothing until `init` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        geoId: sszvis.parseNumber(d["Nr"]),
        name: d["Gemeinde"] ?? "",
        category: d["Klasse"] ?? "",
        value: sszvis.parseNumber(d["Wert"]),
      })),
      d3.json<Topology>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["agglomeration"]),
        borders: topojson.mesh(topo, topo.objects["agglomeration"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich_lakegreifen"]),
      };
      state.selection = [];
      state.valueDomain = [d3.min(data, vAcc) ?? 0, d3.max(data, vAcc) ?? 0];
      // NOTE: The legend is ordinal, but its colours come from the same
      // sequential scale as the map, so each class is represented by the lowest
      // value in it and the classes are ordered by that value.
      state.categories = sszvis
        .cascade<Datum>()
        .arrayBy(cAcc)
        .apply<Datum[][]>(data)
        .map((group) => ({
          name: cAcc(group[0]),
          value: d3.min(group, vAcc) ?? 0,
        }))
        .sort((a, b) => d3.ascending(catValue(a), catValue(b)));
    }),

  actions: {
    selectHovered(state, _e, d) {
      if (d.datum === undefined) {
        return;
      }
      state.selection = [d.datum];
    },

    deselectHovered(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);
    const columnWidth = Math.min(bounds.innerWidth / LEGEND_COLUMNS, MAX_LEGEND_COLUMN_WIDTH);

    // Scales

    const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    const categoryColorScale = d3
      .scaleOrdinal<string, import("d3").LabColor>()
      .domain(state.categories.map(catName))
      .range(state.categories.map((c) => colorScale(catValue(c))));

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Anteil 75-jährige und Ältere in der Agglomeration Zürich",
        description: "Anteil der Bevölkerung ab 75 Jahren je Gemeinde der Agglomeration Zürich.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .highlight(state.selection)
      .highlightStroke((d) => sszvis.muchDarker(colorScale(vAcc(d))))
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
      .highlightStrokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width) + 1)
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      // NOTE: A feature that matched no datum gets the missing-value texture and
      // never reaches this accessor, so the undefined branch is only here to name
      // the case the signature allows.
      .fill((d) => (d === undefined ? "none" : colorScale(vAcc(d))));

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: MapDatum) => (d.datum === undefined ? "" : nameAcc(d.datum)));

    const tooltip = sszvis
      .tooltip<MapDatum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body((d) =>
        d.datum === undefined
          ? []
          : [["Anteil 75-jährige und Ältere", sszvis.formatPercent(vAcc(d.datum))]],
      )
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible(isSelected(state));

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(categoryColorScale)
      .orientation("vertical")
      .rows(state.categories.length / LEGEND_COLUMNS)
      .columnWidth(columnWidth)
      .columns(LEGEND_COLUMNS);

    // Rendering

    chartLayer
      .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
      .call(choroplethMap);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(
          (bounds.innerWidth - columnWidth * LEGEND_COLUMNS) / 2,
          bounds.innerHeight + LEGEND_GUTTER,
        ),
      )
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .panning<MapDatum>()
      .elementSelector(".sszvis-map__area")
      .on("start", actions.selectHovered)
      .on("pan", actions.selectHovered)
      .on("end", actions.deselectHovered);

    chartLayer.call(interactionLayer);
  },
});

// Helper functions

const isSelected = (state: State) => (d: MapDatum) =>
  d.datum !== undefined && sszvis.contains(state.selection, d.datum);
