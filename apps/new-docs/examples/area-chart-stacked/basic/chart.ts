/**
 * Stacked area chart with a range ruler that reads off the highlighted date.
 *
 * @sszvis   3.5.1
 * @chart    area-chart-stacked
 * @features tooltip, ruler, range-flag
 * @date     2026-09-14
 */

// Magic Numbers

/** Headroom in pixels above the tallest stack, so the top band is not clipped. */
const TOP_HEADROOM = 10;

// Types

type Datum = {
  category: string;
  xValue: Date;
  yValue: number;
};

/** One date's worth of data, shaped the way d3's stack layout wants it. */
type StackRow = {
  xValue: Date;
  /** One entry per category, keyed by category name. */
  values: Record<string, number>;
};

/** One band of the stack, as d3's stack layout produces it. */
type StackSeries = import("d3").Series<StackRow, string>;
type StackPoint = import("d3").SeriesPoint<StackRow>;

/** A point on one stacked band, as the range ruler and the range flag read it. */
type HighlightPoint = {
  0: number;
  1: number;
  data: StackRow;
  key: string;
};

type State = {
  data: Datum[];
  timeExtent: [Date, Date];
  stackedData: StackSeries[];
  /** The stack's keys, in layer order. */
  stackKeys: string[];
  maxStacked: number;
  categories: string[];
  dates: Date[];
  highlightDate: Date;
  highlightData: HighlightPoint[];
  totalHighlightValue: number;
  /** The pointer's y position, in the y scale's own domain units. */
  mouseYValue: number;
};

type Actions = {
  changeDate: (
    state: State,
    e: Event,
    xValue: Date | number | string | null,
    yValue: number | string | null,
  ) => void;
  resetDate: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("xLabelFormat", { _: () => sszvis.formatYear });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const yAcc = (d: Datum) => d.yValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      // NOTE: A row whose year cannot be parsed is skipped - returning null from a
      // d3 row callback drops the row - because every band is positioned by date.
      .csv(config.data, (d) => {
        const xValue = sszvis.parseYear(d["Jahr"]);
        return xValue === null
          ? null
          : {
              category: d["Nationalität"] ?? "",
              xValue,
              yValue: sszvis.parseNumber(d["Anzahl"]),
            };
      })
      .then((data) => {
        const categories = sszvis.set(data, cAcc);
        const rows = stackRows(data, categories);

        state.data = data;
        state.categories = categories;
        state.dates = sszvis.set(data, xAcc);
        state.timeExtent = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        // NOTE: The keys are reversed so that the first category ends up on top of
        // the stack rather than at its base.
        state.stackKeys = [...categories].reverse();
        state.stackedData = d3
          .stack<StackRow, string>()
          .keys(state.stackKeys)
          .value((row, key) => row.values[key])(rows);
        state.maxStacked = d3.max(rows, (row) => d3.sum(categories, (c) => row.values[c])) ?? 0;

        // NOTE: The chart opens on the most recent date.
        selectDate(state, d3.max(state.dates) ?? new Date(), 0);
      }),

  actions: {
    // NOTE: The move behavior inverts the pointer position through both scales, so
    // it hands back a date anywhere in the domain; the data has one stack per
    // date, so the nearest one wins.
    changeDate(state, _e, xValue, yValue) {
      if (xValue instanceof Date && typeof yValue === "number") {
        selectDate(state, closestDate(state.dates, xValue), yValue);
      }
    },

    resetDate(state) {
      selectDate(state, d3.max(state.dates) ?? new Date(), 0);
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.timeExtent.map(props.xLabelFormat),
        legendLabels: state.categories,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds({ top: 20, bottom: legendLayout.bottomPadding }, config.id);

    // Scales

    const xScale = d3.scaleTime().domain(state.timeExtent).range([0, bounds.innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, state.maxStacked])
      .range([bounds.innerHeight, TOP_HEADROOM]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Wohnbevölkerung nach Nationalität",
        description: "Ausländische und schweizerische Wohnbevölkerung der Stadt Zürich pro Jahr.",
      })
      .datum(state.stackedData);

    const htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    const stackedArea = sszvis
      .stackedArea<StackPoint, StackSeries>()
      .key((layer) => layer.key)
      .x((d) => xScale(d.data.xValue))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .fill((layer) => String(cScale(layer.key)));

    const isFlipped = () => xScale(state.highlightDate) >= 0.5 * bounds.innerWidth;

    const rangeRuler = sszvis
      .annotationRangeRuler<HighlightPoint>()
      .top(yScale(state.totalHighlightValue))
      .bottom(bounds.innerHeight)
      .x(xScale(state.highlightDate))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      // NOTE: the ruler pipes this through formatNumber, so return the number itself.
      .label((d) => d.data.values[d.key])
      .total(state.totalHighlightValue)
      .flip(isFlipped);

    const tooltipText = sszvis
      .modularTextHTML()
      .bold((d: HighlightPoint) => sszvis.formatNumber(d.data.values[d.key]))
      .plain((d: HighlightPoint) => d.key);

    const rangeTooltip = sszvis
      .tooltip<HighlightPoint>()
      .header(tooltipText)
      .orientation(() => (isFlipped() ? "right" : "left"))
      .renderInto(htmlLayer)
      .visible(true);

    const rangeFlag = sszvis
      .annotationRangeFlag<HighlightPoint>()
      .x(xScale(state.highlightDate))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      // NOTE: The highlighted date gets a tick of its own, on top of the regular ones.
      .tickValues([...xScale.ticks(), state.highlightDate])
      .tickFormat((d) => props.xLabelFormat(new Date(d.valueOf())))
      .highlightTick((d) => sszvis.stringEqual(d, state.highlightDate))
      .alignOuterLabels(true);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .contour(true)
      .orient("right")
      .tickValues(yScale.ticks());

    // Rendering

    chartLayer.selectGroup("areachart").call(stackedArea);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding),
      )
      .call(colorLegend);

    chartLayer.selectGroup("highlight").datum(state.highlightData).call(rangeRuler);

    // NOTE: Only the band the pointer is inside gets a flag, and with it a tooltip.
    const flagGroup = chartLayer
      .selectGroup("flag")
      .datum(
        state.highlightData.filter((d) => d[0] < state.mouseYValue && d[1] > state.mouseYValue),
      )
      .call(rangeFlag);

    flagGroup.selectAll("[data-tooltip-anchor]").call(rangeTooltip);

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

/**
 * Reshape the flat rows into one row per date, with a value per category, which is
 * the shape d3's stack layout consumes.
 */
const stackRows = (data: Datum[], categories: string[]): StackRow[] =>
  sszvis
    .cascade<Datum>()
    .arrayBy((d) => xAcc(d).getTime())
    .objectBy(cAcc)
    .apply<Record<string, Datum[]>[]>(data)
    .map((group) => ({
      xValue: xAcc(Object.values(group)[0][0]),
      values: Object.fromEntries(categories.map((c) => [c, yAcc(group[c][0])])),
    }));

/**
 * Move the ruler to `date`: everything it draws is derived from the date and from
 * the pointer's height, so `init` and both actions go through here.
 */
const selectDate = (state: State, date: Date, mouseYValue: number): void => {
  state.highlightDate = date;
  // NOTE: d3 attaches `key` to the Series array itself, and immer's draft proxy for an
  // array exposes only its index properties - so `layer.key` reads as undefined inside an
  // action. The keys are kept as plain strings for exactly this reason.
  state.highlightData = state.stackedData.map((layer, layerIndex) => {
    const point = layer.find((p) => sszvis.stringEqual(p.data.xValue, date));
    return {
      0: point?.[0] ?? 0,
      1: point?.[1] ?? 0,
      data: point?.data ?? emptyRow(date),
      key: state.stackKeys[layerIndex],
    };
  });
  state.totalHighlightValue = d3.sum(
    state.categories,
    (c) => state.highlightData[0]?.data.values[c] ?? 0,
  );
  state.mouseYValue = mouseYValue;
};

/** Stand-in for a date the stack has no row for, so the ruler still has something to read. */
const emptyRow = (date: Date): StackRow => ({ xValue: date, values: {} });

/** The date in `dates` - which is sorted ascending - nearest to `target`. */
const closestDate = (dates: Date[], target: Date): Date => {
  const i = d3.bisectLeft(dates, target, 1);
  const before = dates[i - 1];
  const after = dates[i] ?? before;
  return target.valueOf() - before.valueOf() > after.valueOf() - target.valueOf() ? after : before;
};
