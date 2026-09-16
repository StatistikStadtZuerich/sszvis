/**
 * Scatterplot with a voronoi interaction layer and a categorical colour legend.
 *
 * @sszvis   3.5.1
 * @chart    scatterplot
 * @features tooltip, voronoi
 * @date     2026-09-14
 */

// Magic Numbers

/** Radius of a single dot, in pixels. */
const DOT_RADIUS = 4;
/** White outlines help the eye separate dots that overlap. */
const DOT_STROKE = "#FFFFFF";

// Types

type Datum = {
  xPosition: number;
  yPosition: number;
  category: string;
};

type State = {
  data: Datum[];
  /** The subset of `data` with no two points at the same position - see `init`. */
  voronoiFiltered: Datum[];
  highlightData: Datum[];
  xExtent: [number, number];
  yExtent: [number, number];
  categories: string[];
};

type Actions = {
  setHighlight: (state: State, e: Event, datum?: Datum) => void;
  resetHighlight: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xFormat", { _: () => sszvis.formatFractionPercent })
  .prop("yFormat", { _: () => sszvis.formatNumber })
  .prop("xAxisLabel", { _: "Prozent" })
  .prop("yAxisLabel", { _: "Wert" })
  .prop("yTicks", { _: 4 });

// Accessors

const xAcc = (d: Datum) => d.xPosition;
const yAcc = (d: Datum) => d.yPosition;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        xPosition: sszvis.parseNumber(d["Prozent"]),
        yPosition: sszvis.parseNumber(d["Wert"]),
        category: d["Stadt"] ?? "",
      }))
      .then((data) => {
        state.data = data;
        // NOTE: The voronoi behaviour requires that no two input vertices lie at
        // exactly the same point, so its data is de-duplicated by position.
        state.voronoiFiltered = sszvis.derivedSet(data, (d) => `${xAcc(d)}__${yAcc(d)}`);
        state.xExtent = [d3.min(data, xAcc) ?? 0, d3.max(data, xAcc) ?? 0];
        state.yExtent = [d3.min(data, yAcc) ?? 0, d3.max(data, yAcc) ?? 0];
        state.categories = sszvis.set(data, cAcc);
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

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.xExtent.map(props.xFormat),
        legendLabels: state.categories,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds({ top: 20, bottom: legendLayout.bottomPadding }, config.id);

    // Scales

    const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Wert nach Prozentanteil",
        description: "Streudiagramm der Werte gegen ihren Prozentanteil, nach Stadt eingefärbt.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.highlightData);

    // Components

    const dots = sszvis
      .dot<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .radius(DOT_RADIUS)
      .fill((d) => String(cScale(cAcc(d))))
      .stroke(DOT_STROKE);

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .tickFormat((d) => props.xFormat(Number(d)))
      .title(props.xAxisLabel);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .ticks(props.yTicks)
      .orient("right")
      .contour(true)
      .showZeroY(true)
      .tickFormat((d) => props.yFormat(Number(d)))
      .title(props.yAxisLabel);

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header(cAcc)
      .body((d) => [
        [props.xAxisLabel, props.xFormat(xAcc(d))],
        [props.yAxisLabel, props.yFormat(yAcc(d))],
      ])
      .visible((d) => sszvis.contains(state.highlightData, d))
      .orientation((d) => (xScale(xAcc(d.datum)) <= bounds.innerWidth / 2 ? "left" : "right"));

    // Rendering

    chartLayer.selectGroup("dots").call(dots);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .call(yAxis)
      .selectAll<SVGTextElement, unknown>("text")
      .each(hideTickLabelBelow(bounds.innerHeight));

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding),
      )
      .call(colorLegend);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

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
