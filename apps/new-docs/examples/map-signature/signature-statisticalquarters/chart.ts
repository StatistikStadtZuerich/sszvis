/**
 * Signature map of the statistical quarters of Zurich, with one bubble per quarter.
 *
 * @category map-signature
 */

// Magic Numbers

/** Vertical padding above and below the map, in px. */
const VERTICAL_PADDING = 30;
/** Distance of the radius legend from the bottom of the map, in px. */
const LEGEND_BOTTOM_OFFSET = 65;
/** Half the width of the radius legend, in px, used to centre it. */
const LEGEND_HALF_WIDTH = 205;

// Types

type MapData = {
  features: ReturnType<typeof topojson.feature>;
  borders: ReturnType<typeof topojson.mesh>;
  lakeFeatures: ReturnType<typeof topojson.feature>;
  lakeBorders: ReturnType<typeof topojson.mesh>;
};

type Datum = {
  id: number;
  value: number;
  zonename: string;
};

/** What the map binds to each area and bubble: a feature paired with its datum, if any. */
type AnchorDatum = { datum: Datum | undefined };

type State = {
  data: Datum[];
  mapData: MapData | null;
  selection: Datum[];
  valueRange: [number, number];
};

type Actions = {
  selectHovered: (state: State, e: Event, d: AnchorDatum) => void;
  deselectHovered: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width: number) => ({
      top: VERTICAL_PADDING,
      bottom: VERTICAL_PADDING,
      height: VERTICAL_PADDING + sszvis.aspectRatioSquare(width) + VERTICAL_PADDING,
    }),
  })
  .prop("legendX", {
    _: (width: number) => Math.max(width / 2 - LEGEND_HALF_WIDTH, 5),
  })
  .prop("radiusMax", {
    _: (width: number) => Math.min(14, Math.max(width / 28, 10)),
  });

// Accessors

const vAcc = (d: Datum) => d.value;
const zoneNameAcc = (d: Datum) => d.zonename;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        id: sszvis.parseNumber(d["zoneid"]),
        value: sszvis.parseNumber(d["value"]),
        zonename: d["zonename"] ?? "--",
      })),
      d3.json<Topology>("/preview/_static/topo/stadt-zurich.json"),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error("The city topology could not be loaded");
      }
      state.data = data;
      state.valueRange = [0, d3.max(data, vAcc) ?? 0];
      state.selection = [];
      state.mapData = {
        features: topojson.feature(topo, topo.objects["statistische_quartiere"]),
        borders: topojson.mesh(topo, topo.objects["statistische_quartiere"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["statistische_quartiere_lakebounds"]),
      };
    }),

  actions: {
    selectHovered(state, _e, d) {
      state.selection = d.datum === undefined ? [] : [d.datum];
    },

    deselectHovered(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    if (state.mapData === null) {
      return;
    }

    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    // NOTE: A quantity shown as a circle belongs in the circle's area, not its radius - a
    // square-root scale on the radius is what makes the area proportional to the value.
    const radiusScale = d3.scaleSqrt().domain(state.valueRange).range([0, props.radiusMax]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Wert je statistisches Quartier",
        description: "Ein Kreis je statistisches Quartier, dessen Fläche den Wert abbildet.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    // NOTE: One series, so one colour, taken deliberately from the palette rather than
    // through an accessor that would imply a mapping which is not happening.
    const bubbleFill = sszvis.scaleQual6()("value");

    const bubbleMap = sszvis
      .mapRendererBubble<Datum>()
      .fill(bubbleFill)
      .radius((d) => (sszvis.defined(d) ? radiusScale(vAcc(d)) : 0))
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width));

    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .lakeBorders(state.mapData.lakeBorders)
      .keyName("id")
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .fill((d) => (isSelected(state)(d) ? sszvis.scaleDimGry()(0) : sszvis.scaleGry()(0)))
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
      .transitionColor(false)
      .anchoredShape(bubbleMap);

    const tooltipHeader = sszvis
      .modularTextHTML()
      .plain((d: AnchorDatum) => (d.datum === undefined ? "" : sszvis.formatNumber(vAcc(d.datum))));

    const tooltipBody = sszvis
      .modularTextHTML()
      .plain((d: AnchorDatum) => (d.datum === undefined ? "--" : zoneNameAcc(d.datum)));

    const tooltip = sszvis
      .tooltip<AnchorDatum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body(tooltipBody)
      .visible((d) => isSelected(state)(d.datum));

    const radiusLegend = sszvis
      .legendRadius()
      .scale(radiusScale)
      .tickFormat(sszvis.formatPreciseNumber(1));

    // Rendering

    chartLayer
      .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
      .call(choroplethMap);

    chartLayer
      .selectGroup("radiusLegend")
      .attr(
        "transform",
        sszvis.translateString(props.legendX, bounds.innerHeight - LEGEND_BOTTOM_OFFSET),
      )
      .call(radiusLegend);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    const interactionLayer = sszvis
      .panning<AnchorDatum>()
      .elementSelector(".sszvis-map__area--entering, .sszvis-anchored-circle--entering")
      .on("start", actions.selectHovered)
      .on("pan", actions.selectHovered)
      .on("end", actions.deselectHovered);

    chartLayer.call(interactionLayer);
  },
});

// Helper functions

/** A quarter is selected when its own datum is the one the pointer last rested on. */
const isSelected = (state: State) => (d: Datum | undefined) =>
  sszvis.defined(d) && sszvis.contains(state.selection, d);
