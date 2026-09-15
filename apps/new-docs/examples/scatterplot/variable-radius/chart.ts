/**
 * Scatterplot whose dot radius carries a third variable, with a radius legend.
 *
 * @category scatterplot
 */

// Magic Numbers

/** Smallest and largest dot radius in pixels, for the two ends of the radius scale. */
const RADIUS_RANGE: [number, number] = [1, 20];
/** White outlines help the eye separate dots that overlap. */
const DOT_STROKE = "#FFFFFF";
// NOTE: One series, so one colour: the radius, not the fill, carries the third
// variable. This is the ordinal scale's only key.
const SERIES_KEY = "Bestand";
/** Below this value an x axis tick is labelled with one significant digit instead. */
const X_TICK_PRECISION_THRESHOLD = 1;

// Types

type Datum = {
  xPosition: number;
  yPosition: number;
  radius: number;
  label: string;
};

type State = {
  data: Datum[];
  /** The subset of `data` with no two points at the same position - see `init`. */
  voronoiFiltered: Datum[];
  highlightData: Datum[];
  xExtent: [number, number];
  yExtent: [number, number];
  rExtent: [number, number];
};

type Actions = {
  setHighlight: (state: State, e: Event, datum?: Datum) => void;
  resetHighlight: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xAxisLabel", { _: "NeubauAbs" })
  .prop("yAxisLabel", { _: "LeerZunRel" })
  .prop("rLabel", { _: "Radius" })
  .prop("legendPadding", { _: 60 });

// Accessors

const xAcc = (d: Datum) => d.xPosition;
const yAcc = (d: Datum) => d.yPosition;
const rAcc = (d: Datum) => d.radius;
const cAcc = (d: Datum) => d.label;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        xPosition: sszvis.parseNumber(d["NeubauAbs (x-Achse)"]),
        yPosition: sszvis.parseNumber(d["LeerZunRel (y-Achse) "]),
        radius: sszvis.parseNumber(d["Best13Radius (bubble)"]),
        label: d["QuName"] ?? "",
      }))
      .then((data) => {
        state.data = data;
        // NOTE: The voronoi behaviour requires that no two input vertices lie at
        // exactly the same point, so its data is de-duplicated by position.
        state.voronoiFiltered = sszvis.derivedSet(data, (d) => `${xAcc(d)}__${yAcc(d)}`);
        state.xExtent = [d3.min(data, xAcc) ?? 0, d3.max(data, xAcc) ?? 0];
        state.yExtent = [d3.min(data, yAcc) ?? 0, d3.max(data, yAcc) ?? 0];
        // NOTE: Rounded outwards so that the radius legend can label whole values.
        state.rExtent = [Math.floor(d3.min(data, rAcc) ?? 0), Math.ceil(d3.max(data, rAcc) ?? 0)];
        state.highlightData = [];
      }),

  actions: {
    // NOTE: The voronoi behaviour types its datum as optional, because a touch
    // can end outside every cell; "over" always carries one.
    setHighlight(state, _e, datum) {
      state.highlightData = datum === undefined ? [] : [datum];
    },

    resetHighlight(state) {
      state.highlightData = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds({ top: 20, bottom: 110 }, config.id);

    // Scales

    const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

    const rScale = d3.scaleLinear().domain(state.rExtent).range(RADIUS_RANGE);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Neubau, Leerstandszunahme und Bestand nach Quartier",
        description:
          "Streudiagramm der Quartiere; die Fläche der Punkte zeigt den Wohnungsbestand.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.highlightData);

    // Components

    const dots = sszvis
      .dot<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .radius((d) => rScale(rAcc(d)))
      .fill(String(sszvis.scaleQual12()(SERIES_KEY)))
      .stroke(DOT_STROKE);

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .contour(true)
      .tickFormat((d) => {
        const value = Number(d);
        return value < X_TICK_PRECISION_THRESHOLD ? value.toPrecision(1) : String(value);
      })
      .title(props.xAxisLabel);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .showZeroY(true)
      .contour(true)
      .title(props.yAxisLabel);

    const radiusLegend = sszvis
      .legendRadius()
      .scale(rScale)
      .tickFormat((d) => String(Math.round(Number(d) * 100) / 100));

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header(cAcc)
      .body((d) => [
        [props.xAxisLabel, sszvis.formatNumber(xAcc(d))],
        [props.yAxisLabel, sszvis.formatNumber(yAcc(d))],
        [props.rLabel, sszvis.formatNumber(rAcc(d))],
      ])
      .visible((d) => sszvis.contains(state.highlightData, d))
      .orientation((d) => (xScale(xAcc(d.datum)) <= bounds.innerWidth / 2 ? "left" : "right"));

    // Rendering

    chartLayer.selectGroup("dots").call(dots);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("radiusLegend")
      .attr("transform", sszvis.translateString(1, bounds.innerHeight + props.legendPadding))
      .call(radiusLegend);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .call(yAxis)
      .selectAll<SVGTextElement, unknown>("text")
      .each(hideTickLabelBelow(bounds.innerHeight));

    // Interaction

    const mouseOverlay = sszvis
      .voronoi<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .bounds([0, 0, bounds.innerWidth, bounds.innerHeight])
      .on("over", actions.setHighlight)
      .on("out", actions.resetHighlight);

    chartLayer.selectGroup("voronoiMouse").datum(state.voronoiFiltered).call(mouseOverlay);
  },
});

// Helper functions

/**
 * The y axis is drawn to the full height of the chart, so its lowest label can
 * collide with the x axis. Any label whose box reaches past `maxBottom` - in
 * viewport pixels, as reported by `getBoundingClientRect` - is hidden.
 */
const hideTickLabelBelow = (maxBottom: number) =>
  function (this: SVGTextElement) {
    if (this.getBoundingClientRect().bottom >= maxBottom) {
      d3.select(this.parentElement).style("display", "none");
    }
  };
