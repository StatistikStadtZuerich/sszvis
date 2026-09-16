/**
 * Basic line chart example with one line per category and a ruler highlight.
 *
 * @sszvis   3.5.1
 * @chart    line-chart
 * @features ruler
 * @date     2026-09-14
 */

// Magic Numbers

/** Vertical offset of the y axis title, in pixels. */
const Y_TITLE_OFFSET = -20;
/** Top padding when the chart has a y axis title, and when it has none. */
const TOP_PADDING_WITH_TITLE = 30;
const TOP_PADDING_WITHOUT_TITLE = 10;

// Types

/** d3's tick-value type: what an axis hands its `tickFormat`. */
type AxisDomain = import("d3").AxisDomain;

/** `app()`'s effect type, which the `sszvis` global cannot name. */
type Effect = (dispatch: (action: string, props: readonly unknown[]) => void) => void;

type Datum = {
  xValue: Date;
  yValue: number;
  category: string;
};

type State = {
  data: Datum[];
  lineData: Datum[][];
  xValues: [Date, Date];
  categories: string[];
  maxY: number;
  selection: Datum[];
};

type Actions = {
  resetDate: (state: State) => Effect;
  changeDate: (state: State, e: Event, inputDate: Date | null) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("rulerLabel", {
    _: () =>
      sszvis
        .modularTextSVG()
        .bold((d: Datum) => yLabelFormat(yAcc(d)) ?? "")
        .plain((d: Datum) => cAcc(d)),
  })
  .prop("xLabel", { _: "" })
  .prop("yLabel", { _: "" })
  .prop("ticks", { palm: 4, _: 5 });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const yAcc = (d: Datum) => d.yValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => {
        const xValue = sszvis.parseDate(d["Datum"]);
        // NOTE: A row whose date cannot be parsed has no position on the time
        // axis; returning null from the row callback drops it from the data.
        return xValue === null
          ? null
          : {
              xValue,
              yValue: sszvis.parseNumber(d["Anzahl"]),
              category: d["Kategorie"] ?? "",
            };
      })
      .then((data) => {
        state.data = data;
        state.lineData = sszvis.cascade<Datum>().arrayBy(cAcc, d3.ascending).apply<Datum[][]>(data);
        state.xValues = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        state.categories = sszvis.set(data, cAcc);
        state.maxY = d3.max(data, yAcc) ?? 0;
        state.selection = [];
        // NOTE: The chart opens with the most recent date highlighted.
        return (dispatch) => dispatch("resetDate", []);
      }),

  actions: {
    resetDate(state) {
      const mostRecentDate = d3.max(state.data, xAcc) ?? null;
      return (dispatch) => dispatch("changeDate", [null, mostRecentDate]);
    },

    changeDate(state, _e, inputDate: Date | null) {
      if (inputDate === null) {
        state.selection = [];
        return;
      }
      // Find the date of the datum closest to the input date, then take the
      // first datum on each line that shares it and has a value to display.
      const closestDate = xAcc(closestDatum(state.data, xAcc, inputDate));
      state.selection = state.lineData.flatMap((linePoints) => {
        const match = sszvis.find((d) => xAcc(d).toString() === closestDate.toString(), linePoints);
        return match === undefined || Number.isNaN(yAcc(match)) ? [] : [match];
      });
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.xValues.map(xLabelFormat),
        legendLabels: state.categories,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds(
      {
        top: props.yLabel.length > 0 ? TOP_PADDING_WITH_TITLE : TOP_PADDING_WITHOUT_TITLE,
        bottom: legendLayout.bottomPadding,
      },
      config.id,
    );

    // Scales

    const xScale = d3.scaleTime().domain(state.xValues).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain([0, state.maxY]).range([bounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Zu- und Wegzüge der Stadt Zürich",
        description: "Zu- und Wegzüge sowie Geburten und Todesfälle je Quartal.",
      })
      .datum(state.lineData);

    // Components

    const line = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      // NOTE: The stroke accessor is handed the whole line, so the colour comes
      // from the category of its first point.
      .stroke((linePoints) => String(cScale(cAcc(linePoints[0]))));

    // NOTE: The highlighted dates are added to the regular ticks, so the ruler
    // always has a labelled tick underneath it. Two equal dates are different
    // objects, so the duplicates are removed by their string form.
    const xTickValues = [
      ...new Map(
        [...xScale.ticks(props.ticks), ...state.selection.map(xAcc)].map((d) => [String(d), d]),
      ).values(),
    ];

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues(xTickValues)
      .tickFormat(xLabelFormat)
      .highlightTick(isSelected(state))
      .alignOuterLabels(true)
      .title(props.xLabel);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .tickFormat(yLabelFormat)
      .contour(true)
      .title(props.yLabel)
      .dyTitle(Y_TITLE_OFFSET);

    const highlightLayer = sszvis
      .annotationRuler<Datum>()
      .top(0)
      .bottom(bounds.innerHeight)
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .label(props.rulerLabel)
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color((d) => cScale(cAcc(d)));

    // Rendering

    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    if (showLegend(state.categories)) {
      chartLayer
        .selectGroup("colorLegend")
        .attr(
          "transform",
          sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding),
        )
        .call(colorLegend);
    }

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

/** Axis labels are years; the data is quarterly, so only the year is shown. */
const xLabelFormat = (d: AxisDomain) => (d instanceof Date ? sszvis.formatYear(d) : String(d));

/** The zero tick is drawn by the axis itself, so it carries no label. */
const yLabelFormat = (d: AxisDomain) => (d === 0 ? null : sszvis.formatNumber(Number(d)));

/** Whether an axis tick sits under the current ruler position. */
const isSelected = (state: State) => (d: AxisDomain) =>
  sszvis.contains(state.selection.map(xAcc).map(String), String(d));

/**
 * The categories are read from the data, so a single unnamed series produces one
 * empty category - and a legend with one blank entry, which is worse than none.
 */
const showLegend = (categories: string[]) => categories[0] != null && categories[0] !== "";

/** The datum whose x-value lies closest to `datum`, by bisection. */
const closestDatum = (data: Datum[], accessor: (d: Datum) => Date, datum: Date) => {
  const i = d3.bisector(accessor).left(data, datum, 1);
  const d0 = data[i - 1];
  const d1 = data[i] ?? d0;
  return datum.valueOf() - accessor(d0).valueOf() > accessor(d1).valueOf() - datum.valueOf()
    ? d1
    : d0;
};
