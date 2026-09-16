/**
 * Line chart example with an ordinal x axis and a ruler highlight.
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
  xValue: string;
  yValue: number;
  category: string;
};

type State = {
  data: Datum[];
  lineData: Datum[][];
  xValues: string[];
  categories: string[];
  maxY: number;
  selection: Datum[];
};

type Actions = {
  resetDate: (state: State) => Effect;
  changeDate: (state: State, e: Event, inputValue: string | null) => void;
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
  .prop("yLabel", { _: "" });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const yAcc = (d: Datum) => d.yValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        xValue: d["Jahr"] ?? "",
        yValue: sszvis.parseNumber(d["Wert"]),
        // NOTE: The data is a single unnamed series, so every datum shares one
        // empty category and the legend is left out; see `showLegend`.
        category: "",
      }))
      .then((data) => {
        state.data = data;
        state.lineData = sszvis.cascade<Datum>().arrayBy(cAcc, d3.ascending).apply<Datum[][]>(data);
        state.xValues = sszvis.set(data, xAcc);
        state.categories = sszvis.set(data, cAcc);
        state.maxY = d3.max(data, yAcc) ?? 0;
        state.selection = [];
        // NOTE: The chart opens with the most recent period highlighted.
        return (dispatch) => dispatch("resetDate", []);
      }),

  actions: {
    resetDate(state) {
      const mostRecentValue = d3.max(state.data, xAcc) ?? null;
      return (dispatch) => dispatch("changeDate", [null, mostRecentValue]);
    },

    changeDate(state, _e, inputValue: string | null) {
      if (inputValue === null) {
        state.selection = [];
        return;
      }
      // Find the period closest to the pointer, then take the first datum on
      // each line that shares it and has a value to display.
      const closestValue = xAcc(closestDatum(state.data, xAcc, inputValue));
      state.selection = state.lineData.flatMap((linePoints) => {
        const match = sszvis.find((d) => xAcc(d) === closestValue, linePoints);
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

    const xScale = d3
      .scalePoint<string>()
      .padding(0)
      .domain(state.xValues)
      .range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain([0, state.maxY]).range([bounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Anteil nach Schuljahr",
        description: "Entwicklung des Anteils über die Schuljahre hinweg.",
      })
      .datum(state.lineData);

    // Components

    const line = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)) ?? 0)
      .y((d) => yScale(yAcc(d)))
      // NOTE: The stroke accessor is handed the whole line, so the colour comes
      // from the category of its first point.
      .stroke((linePoints) => String(cScale(cAcc(linePoints[0]))));

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
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
      .x((d) => xScale(xAcc(d)) ?? 0)
      .y((d) => yScale(yAcc(d)))
      .label(props.rulerLabel)
      .flip((d) => (xScale(xAcc(d)) ?? 0) >= bounds.innerWidth / 2)
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
      .move<string, number>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/** The x values are school years like "05/06", so they are shown verbatim. */
const xLabelFormat = (d: AxisDomain) => sszvis.formatText(d);

/** The zero tick is drawn by the axis itself, so it carries no label. */
const yLabelFormat = (d: AxisDomain) => (d === 0 ? null : sszvis.formatFractionPercent(Number(d)));

/** Whether an axis tick sits under the current ruler position. */
const isSelected = (state: State) => (d: AxisDomain) =>
  sszvis.contains(state.selection.map(xAcc).map(String), String(d));

/**
 * The categories are read from the data, so a single unnamed series produces one
 * empty category - and a legend with one blank entry, which is worse than none.
 */
const showLegend = (categories: string[]) => categories[0] != null && categories[0] !== "";

/** The datum at the pointer's position, falling back to the first one. */
const closestDatum = (data: Datum[], accessor: (d: Datum) => string, value: string) =>
  sszvis.find((d) => accessor(d) === value, data) ?? data[0];
