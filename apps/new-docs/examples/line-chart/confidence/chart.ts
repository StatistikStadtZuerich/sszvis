/**
 * Line chart example with a confidence interval around the highlighted series.
 *
 * @sszvis   3.5.1
 * @chart    line-chart
 * @features ruler, confidence, legend
 * @date     2026-09-14
 */

// Magic Numbers

/** Number of ticks on the y axis. */
const Y_TICKS = 5;
/** Vertical offset of the y axis title, in pixels. */
const Y_TITLE_OFFSET = -20;
/** Distance between the x axis and the colour legend, in pixels. */
const LEGEND_OFFSET = 40;
/**
 * The y domain is padded downwards by this much, in the data's own units -
 * percentage points - so that a series sitting exactly on the domain minimum is
 * still drawn inside the chart area rather than on its edge.
 */
const Y_DOMAIN_PADDING = 0.001;

// Types

/** d3's tick-value type: what an axis hands its `tickFormat`. */
type AxisDomain = import("d3").AxisDomain;

type Datum = {
  date: Date;
  category: string;
  value: number;
  lower: number;
  upper: number;
};

type State = {
  data: Datum[];
  lineData: Datum[][];
  dates: [Date, Date];
  yExtent: [number, number];
  categories: string[];
  selection: Datum[];
  confSelection: Datum[];
};

type Actions = {
  changeDate: (state: State, e: Event, inputDate: Date | null, yValue: number | null) => void;
  resetDate: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .breakpoints([
    { name: "small", width: 280 },
    { name: "narrow", width: 516 },
  ])
  .prop("bottomPadding", { small: 130, narrow: 100, _: 100 })
  .prop("xTicks", { narrow: 5, _: 5 })
  .prop("xLabel", { _: "" })
  .prop("yLabel", { _: "" });

// Accessors

const xAcc = (d: Datum) => d.date;
const cAcc = (d: Datum) => d.category;
const yAcc = (d: Datum) => d.value;
const lAcc = (d: Datum) => d.lower;
const uAcc = (d: Datum) => d.upper;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => {
        const date = sszvis.parseYear(d["Jahr"]);
        // NOTE: A row whose year cannot be parsed has no position on the time
        // axis; returning null from the row callback drops it from the data.
        return date === null
          ? null
          : {
              date,
              category: d["Bildungsstand"] ?? "",
              value: sszvis.parseNumber(d["Anteil"]),
              lower: sszvis.parseNumber(d["unten"]),
              upper: sszvis.parseNumber(d["oben"]),
            };
      })
      .then((data) => {
        state.data = data;
        state.lineData = sszvis.cascade<Datum>().arrayBy(cAcc, d3.ascending).apply<Datum[][]>(data);
        state.dates = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        state.yExtent = [(d3.min(data, yAcc) ?? 0) - Y_DOMAIN_PADDING, d3.max(data, yAcc) ?? 0];
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
        state.confSelection = [];
      }),

  actions: {
    changeDate(state, _e, inputDate: Date | null, yValue: number | null) {
      if (inputDate === null) {
        state.selection = [];
        return;
      }

      // Take the first datum on each line that shares the date closest to the
      // pointer and has a value to display.
      const closestDate = xAcc(closestDatum(state.data, xAcc, inputDate));
      const closestData = state.lineData.flatMap((linePoints) => {
        const match = sszvis.find((d) => xAcc(d).toString() === closestDate.toString(), linePoints);
        return match === undefined || Number.isNaN(yAcc(match)) ? [] : [match];
      });
      state.selection = closestData;

      // NOTE: Only one confidence band is shown at a time: the one belonging to
      // the line whose value is nearest the pointer vertically.
      const closestToMouse =
        yValue === null ? undefined : d3.least(closestData, (d) => Math.abs(yAcc(d) - yValue));
      state.confSelection =
        closestToMouse === undefined
          ? []
          : state.data.filter((d) => cAcc(d) === cAcc(closestToMouse));
    },

    // NOTE: The confidence band is deliberately left in place when the pointer
    // leaves the chart, so the last inspected series keeps its interval.
    resetDate(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds({ top: 60, bottom: props.bottomPadding }, config.id);

    // Scales

    const xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

    const cScale = sszvis.scaleQual6().domain(state.categories);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Bildungsstand der Bevölkerung",
      description: "Anteil der Bevölkerung je Bildungsstand, mit Vertrauensintervall.",
    });

    // Components

    const line = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      // NOTE: The stroke accessor is handed the whole line, so the colour comes
      // from the category of its first point.
      .stroke((linePoints) => String(cScale(cAcc(linePoints[0]))));

    const area = sszvis
      .annotationConfidenceArea<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y0((d) => yScale(lAcc(d)))
      .y1((d) => yScale(uAcc(d)))
      .stroke("none")
      .fill(String(sszvis.scalePaleGry()(0)))
      // NOTE: The band is redrawn on every pointer move, so it is not animated.
      .transition(false);

    // NOTE: The highlighted dates are added to the regular ticks, so the ruler
    // always has a labelled tick underneath it.
    const xTickValues = [...xScale.ticks(props.xTicks), ...state.selection.map(xAcc)];

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues(xTickValues)
      .alignOuterLabels(true)
      .highlightTick(isSelected(state))
      .title(props.xLabel);

    const yTickValues = yScale.ticks(Y_TICKS);
    // NOTE: The zero line is only drawn when it is not already a tick.
    const showZero = d3.min(yTickValues) !== 0;

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .tickValues(yTickValues)
      .showZeroY(showZero)
      .tickFormat((d) => (d === 0 && !showZero ? null : sszvis.formatPercent(Number(d))))
      .contour(true)
      .title(props.yLabel)
      .dyTitle(Y_TITLE_OFFSET);

    const rulerLabel = sszvis
      .modularTextSVG()
      .bold((d: Datum) => `${sszvis.formatPreciseNumber(1, yAcc(d))} %`)
      .plain((d: Datum) => cAcc(d));

    const highlightLayer = sszvis
      .annotationRuler<Datum>()
      .top(0)
      .bottom(bounds.innerHeight)
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .label(rulerLabel)
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color((d) => cScale(cAcc(d)))
      // NOTE: The labels of several lines can land on the same spot, so they are
      // matched by category rather than by position and then pushed apart.
      .labelId(cAcc)
      .reduceOverlap(true);

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .horizontalFloat(true)
      .floatWidth(bounds.innerWidth);

    // Rendering

    chartLayer.selectGroup("area").datum([state.confSelection]).call(area);

    chartLayer.selectGroup("line").datum(state.lineData).call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(1, bounds.innerHeight + LEGEND_OFFSET))
      .call(colorLegend);

    chartLayer.selectGroup("highlight").datum(state.selection).call(highlightLayer);

    // Interaction

    const interactionLayer = sszvis
      .move<Date, number>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/** Whether an axis tick sits under the current ruler position. */
const isSelected = (state: State) => (d: AxisDomain) =>
  sszvis.contains(state.selection.map(xAcc).map(String), String(d));

/** The datum whose date lies closest to `datum`, by bisection. */
const closestDatum = (data: Datum[], accessor: (d: Datum) => Date, datum: Date) => {
  const i = d3.bisector(accessor).left(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] ?? d0;
  return datum.valueOf() - accessor(d0).valueOf() > accessor(d1).valueOf() - datum.valueOf()
    ? d1
    : d0;
};
