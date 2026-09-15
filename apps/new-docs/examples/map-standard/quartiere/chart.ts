/**
 * Choropleth map of the statistical quarters (Quartiere) of Zurich.
 *
 * @category map-standard
 */

// Magic Numbers

const MAX_LEGEND_WIDTH = 320;
/** Vertical padding in px above the map. */
const TOP_PADDING = 30;
/** Vertical padding in px below the map, which holds the legend. */
const BOTTOM_PADDING = 90;
/** Gap in px between the bottom of the map and the legend. */
const LEGEND_GUTTER = 60;
const TOPO_URL = "/preview/_static/topo/stadt-zurich.json";

// Types

type Datum = {
  quarternum: number;
  quartername: string;
  value: number;
};

/**
 * What the map binds to each area and to each tooltip anchor: the feature paired
 * with the datum that was matched to it. The pairing is what lets the tooltip be
 * positioned from the geometry, and it is why reading a value means going through
 * `.datum` rather than treating the bound object as the datum itself.
 */
type MapDatum = import("sszvis").MergedGeoDatum<Datum>;

type MapData = {
  features: import("d3").ExtendedFeatureCollection;
  borders: import("d3").GeoPermissibleObjects;
  lakeFeatures: import("d3").GeoPermissibleObjects;
  lakeBorders: import("d3").GeoPermissibleObjects;
};

type State = {
  data: Datum[];
  mapData: MapData;
  valueDomain: [number, number];
  selection: Datum[];
};

type Actions = {
  selectHovered: (state: State, e: Event, d: MapDatum) => void;
  deselectHovered: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width) => {
      const innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: TOP_PADDING,
        bottom: BOTTOM_PADDING,
        height: TOP_PADDING + innerHeight + BOTTOM_PADDING,
      };
    },
  })
  .prop("legendWidth", {
    _: (width) => Math.min(width / 2, MAX_LEGEND_WIDTH),
  })
  // NOTE: The values here are fractions, so the legend labels them as percentages.
  // A chart of absolute numbers would want `sszvis.formatNumber` instead.
  .prop("labelFormat", { _: () => sszvis.formatFractionPercent })
  .prop("tooltipUnit", { _: "Ausländeranteil" });

// Accessors

const vAcc = (d: Datum) => d.value;
const nameAcc = (d: Datum) => d.quartername;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; `app()` renders nothing until `init` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        quarternum: sszvis.parseNumber(d["Qcode"]),
        quartername: d["Qname"] ?? "",
        value: sszvis.parseNumber(d["Ausländeranteil"]),
      })),
      d3.json<{ objects: Record<string, unknown> }>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["statistische_quartiere"]),
        borders: topojson.mesh(topo, topo.objects["statistische_quartiere"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["statistische_quartiere_lakebounds"]),
      };
      state.selection = [];
      state.valueDomain = [0, d3.max(data, vAcc) ?? 0];
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

    // Scales

    const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Ausländeranteil nach Quartier",
        description: "Anteil der ausländischen Wohnbevölkerung je statistisches Quartier.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    // NOTE: Some cells in the CSV are empty, so their parsed value is NaN. Those
    // quarters are drawn with the missing value texture and a white highlight
    // outline instead of a colour from the scale.
    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .lakeBorders(state.mapData.lakeBorders)
      .keyName("quarternum")
      .highlight(state.selection)
      .highlightStroke((d) =>
        Number.isNaN(vAcc(d)) ? "white" : sszvis.muchDarker(colorScale(vAcc(d))),
      )
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .defined((d) => d !== undefined && !Number.isNaN(vAcc(d)))
      .fill((d) => (d === undefined ? "none" : colorScale(vAcc(d))));

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: MapDatum) => (d.datum === undefined ? "" : nameAcc(d.datum)));

    const tooltipBody = sszvis
      .modularTextHTML()
      .plain((d: MapDatum) => {
        const value = d.datum === undefined ? Number.NaN : vAcc(d.datum);
        return Number.isNaN(value) ? "keine Daten" : sszvis.formatFractionPercent(value);
      })
      .plain((d: MapDatum) => {
        const value = d.datum === undefined ? Number.NaN : vAcc(d.datum);
        return Number.isNaN(value) ? null : props.tooltipUnit;
      });

    const tooltip = sszvis
      .tooltip<MapDatum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body(tooltipBody)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible(isSelected(state));

    const legend = sszvis
      .legendColorLinear()
      .scale(colorScale)
      .width(props.legendWidth)
      .labelFormat(props.labelFormat);

    // Rendering

    chartLayer
      .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
      .call(choroplethMap);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("legend")
      .attr(
        "transform",
        sszvis.translateString(
          bounds.width / 2 - props.legendWidth / 2,
          bounds.innerHeight + LEGEND_GUTTER,
        ),
      )
      .call(legend);

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
