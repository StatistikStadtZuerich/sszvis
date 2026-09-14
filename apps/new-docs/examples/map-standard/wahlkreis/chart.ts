/**
 * Choropleth map of the electoral districts (Wahlkreise) of Zurich.
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
/** The fake data runs from 0 to this, so dividing by it yields a fraction. */
const VALUE_SCALE = 20;
const TOPO_URL = "/preview/_static/topo/stadt-zurich.json";

// Types

type Datum = {
  name: string;
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
  selection: Datum[];
  valueDomain: [number, number];
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
  });

// Accessors

const vAcc = (d: Datum) => d.value;
const nameAcc = (d: Datum) => d.name;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; `app()` renders nothing until `init` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        name: d["ID"] ?? "",
        value: sszvis.parseNumber(d["Value"] ?? "") / VALUE_SCALE,
      })),
      d3.json<{ objects: Record<string, unknown> }>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["wahlkreise"]),
        borders: topojson.mesh(topo, topo.objects["wahlkreise"]),
        lakeFeatures: topojson.mesh(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["wahlkreis_lakebounds"]),
      };
      state.selection = [];
      state.valueDomain = [0, 1];
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
        title: "Anteile nach Wahlkreis",
        description: "Anteil je Wahlkreis der Stadt Zürich, in Prozent.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    // NOTE: The data has no geo id of its own, so the district name is what the
    // map matches its features against.
    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .lakeBorders(state.mapData.lakeBorders)
      .keyName("name")
      .highlight(state.selection)
      .highlightStroke((d) => sszvis.muchDarker(colorScale(vAcc(d))))
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      // NOTE: A feature that matched no datum gets the missing-value texture and
      // never reaches this accessor, so the undefined branch is only here to name
      // the case the signature allows.
      .fill((d) => (d === undefined ? "none" : colorScale(vAcc(d))));

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: MapDatum) =>
        d.datum === undefined ? "" : sszvis.formatFractionPercent(vAcc(d.datum)),
      );

    const tooltipBody = sszvis
      .modularTextHTML()
      .plain("Wahlkreis ")
      .plain((d: MapDatum) => (d.datum === undefined ? "" : nameAcc(d.datum)));

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
      .labelFormat(sszvis.formatFractionPercent);

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
