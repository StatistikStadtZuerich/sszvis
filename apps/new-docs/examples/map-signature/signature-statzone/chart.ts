/**
 * Signature map of the statistical zones of Zurich, with one bubble of births per zone.
 *
 * @category map-signature
 */

// Magic Numbers

/** Vertical space above the map, in px, which holds the control. */
const CONTROL_SPACE = 90;
/** Vertical padding below the map, in px. */
const BOTTOM_PADDING = 30;
/** Distance of the radius legend from the bottom of the map, in px. */
const LEGEND_BOTTOM_OFFSET = 65;
/** Half the width of the radius legend, in px, used to centre it. */
const LEGEND_HALF_WIDTH = 205;

// Types

type MapData = {
  features: ReturnType<typeof topojson.feature>;
  borders: ReturnType<typeof topojson.mesh>;
};

type Filter = "Männlich 1993" | "Weiblich 1993" | "Männlich 2014" | "Weiblich 2014";

type Datum = {
  id: number;
  year: number;
  gender: string;
  births: number;
  zonename: string;
};

/** What the map binds to each area and bubble: a feature paired with its datum, if any. */
type AnchorDatum = { datum: Datum | undefined };

type State = {
  data: Datum[];
  mapData: MapData | null;
  filteredData: Datum[];
  selection: Datum[];
  currentFilter: Filter;
  birthsRange: [number, number];
};

type Actions = {
  setFilter: (state: State, e: Event, filter: Filter) => void;
  selectHovered: (state: State, e: Event, d: AnchorDatum) => void;
  deselectHovered: (state: State) => void;
};

const FILTER_OPTIONS: Filter[] = [
  "Männlich 1993",
  "Weiblich 1993",
  "Männlich 2014",
  "Weiblich 2014",
];

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width: number) => ({
      top: CONTROL_SPACE,
      bottom: BOTTOM_PADDING,
      height: CONTROL_SPACE + sszvis.aspectRatioSquare(width) + BOTTOM_PADDING,
    }),
  })
  .prop("legendX", {
    _: (width: number) => Math.max(width / 2 - LEGEND_HALF_WIDTH, 5),
  })
  .prop("radiusMax", {
    _: (width: number) => Math.min(14, Math.max(width / 28, 10)),
  })
  // NOTE: The four options do not fit side by side on a phone, so the button group gives
  // way to a select menu there. Both controls share the same interface.
  .prop("control", {
    palm: () => sszvis.selectMenu<Filter>,
    _: () => sszvis.buttonGroup<Filter>,
  })
  .prop("controlWidth", {
    _: (width: number) => Math.min(width, sszvis.aspectRatioSquare.MAX_HEIGHT),
  });

// Accessors

const yearAcc = (d: Datum) => d.year;
const genderAcc = (d: Datum) => d.gender;
const birthsAcc = (d: Datum) => d.births;
const zoneNameAcc = (d: Datum) => d.zonename;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        id: sszvis.parseNumber(d["statistischeZoneId"]),
        year: sszvis.parseNumber(d["Jahr"]),
        gender: d["Geschlecht"] ?? "",
        births: sszvis.parseNumber(d["Geburten"]),
        zonename: d["statistischeZoneName"] ?? "--",
      })),
      d3.json<Topology>("/preview/_static/topo/stadt-zurich.json"),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error("The city topology could not be loaded");
      }
      state.data = data;
      state.birthsRange = [0, d3.max(data, birthsAcc) ?? 0];
      state.currentFilter = "Weiblich 1993";
      state.filteredData = matching(data, state.currentFilter);
      state.selection = [];
      state.mapData = {
        features: topojson.feature(topo, topo.objects["statistische_zonen"]),
        borders: topojson.mesh(topo, topo.objects["statistische_zonen"]),
      };
    }),

  actions: {
    setFilter(state, _e, filter) {
      state.currentFilter = filter;
      state.filteredData = matching(state.data, filter);
    },

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
    const radiusScale = d3.scaleSqrt().domain(state.birthsRange).range([0, props.radiusMax]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Geburten nach statistischer Zone",
        description: "Ein Kreis je statistische Zone, dessen Fläche die Anzahl Geburten abbildet.",
      })
      .datum(state.filteredData);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    // NOTE: One series, so one colour, taken deliberately from the palette rather than
    // through an accessor that would imply a mapping which is not happening.
    const bubbleFill = sszvis.scaleQual6()("births");

    const bubbleMap = sszvis
      .mapRendererBubble<Datum>()
      .fill(bubbleFill)
      .radius((d) => (sszvis.defined(d) ? radiusScale(birthsAcc(d)) : 0))
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width));

    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .keyName("id")
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .fill((d) => (isSelected(state)(d) ? sszvis.scaleDimGry()(0) : sszvis.scaleGry()(0)))
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
      .transitionColor(false)
      .anchoredShape(bubbleMap);

    const tooltipHeader = sszvis
      .modularTextHTML()
      .plain((d: AnchorDatum) => (d.datum === undefined ? "" : birthsAcc(d.datum) + " Geburten"));

    const tooltipBody = sszvis
      .modularTextHTML()
      .plain((d: AnchorDatum) => (d.datum === undefined ? "--" : zoneNameAcc(d.datum)));

    const tooltip = sszvis
      .tooltip<AnchorDatum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body(tooltipBody)
      .visible((d) => isSelected(state)(d.datum));

    const control = props
      .control()
      .values(FILTER_OPTIONS)
      .current(state.currentFilter)
      .width(props.controlWidth)
      .change(actions.setFilter);

    const radiusLegend = sszvis
      .legendRadius()
      .scale(radiusScale)
      .tickFormat(sszvis.formatPreciseNumber(1));

    // Rendering

    chartLayer.call(choroplethMap);

    chartLayer
      .selectGroup("radiusLegend")
      .attr(
        "transform",
        sszvis.translateString(props.legendX, bounds.innerHeight - LEGEND_BOTTOM_OFFSET),
      )
      .call(radiusLegend);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    tooltipLayer
      .selectDiv("controls")
      .style("left", (bounds.innerWidth - control.width()) / 2 + "px")
      .style("top", 20 - bounds.padding.top + "px")
      .call(control);

    // Interaction

    const interactionLayer = sszvis
      .panning<AnchorDatum>()
      .elementSelector(".sszvis-map__area, .sszvis-anchored-circle")
      .on("start", actions.selectHovered)
      .on("pan", actions.selectHovered)
      .on("end", actions.deselectHovered);

    chartLayer.call(interactionLayer);
  },
});

// Helper functions

/** The rows for one of the control's options, which names a gender and a year. */
const matching = (data: Datum[], filter: Filter) => {
  const [gender, year] = filter.toLowerCase().split(" ");
  return data.filter(
    (d) => genderAcc(d) === gender && yearAcc(d) === Number.parseInt(year ?? "", 10),
  );
};

/** A zone is selected when its own datum is the one the pointer last rested on. */
const isSelected = (state: State) => (d: Datum | undefined) =>
  sszvis.defined(d) && sszvis.contains(state.selection, d);
