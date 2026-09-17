/**
 * __TITLE__
 *
 * @generator sszvis-chart-builder
 * @sszvis    __SSZVIS_VERSION__
 * @chart     __CHART__
 * @features  __FEATURES__
 * @date      __DATE__
 */

// Magic Numbers

/** Headroom in pixels above the tallest stack, so the top band is not clipped. */
const TOP_HEADROOM = 10;
// {{block:magicNumbers}}

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

type State = {
  data: Datum[];
  timeExtent: [Date, Date];
  stackedData: StackSeries[];
  /** The stack's keys, in layer order. */
  stackKeys: string[];
  maxStacked: number;
  categories: string[];
  dates: Date[];
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// {{block:types}}

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  /* Enough ticks to read the span, few enough that the labels do not repeat. */
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
      // NOTE: A row whose date cannot be parsed is skipped - returning null from a
      // d3 row callback drops the row - because every band is positioned by date.
      .csv(config.data, (d) => {
        const xValue = __DATE_PARSER__(d[__DATE_FIELD__]);
        return xValue === null
          ? null
          : {
              category: __CATEGORY_EXPR__,
              xValue,
              yValue: sszvis.parseNumber(d[__VALUE_FIELD__]),
            };
      })
      .then((data) => {
        const categories = sszvis.set(data, cAcc);
        const rows = stackRows(data, categories);

        state.data = data;
        state.categories = categories;
        state.dates = sszvis.set(data, xAcc).sort((a, b) => a.valueOf() - b.valueOf());
        state.timeExtent = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        // NOTE: The keys are reversed so that the first category ends up on top of
        // the stack rather than at its base.
        state.stackKeys = [...categories].reverse();
        state.stackedData = d3
          .stack<StackRow, string>()
          .keys(state.stackKeys)
          .value((row, key) => row.values[key] ?? 0)(rows);
        state.maxStacked =
          d3.max(rows, (row) => d3.sum(categories, (c) => row.values[c] ?? 0)) ?? 0;
        // {{block:init}}
      }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    // {{block:preBounds}}

    const bounds = sszvis.bounds({ top: 20, bottom: __BOTTOM_PADDING__ }, config.id);

    // Scales

    const xScale = d3.scaleTime().domain(state.timeExtent).range([0, bounds.innerWidth]);

    /*
     * NOTE: A nonzero upper bound when there is nothing to scale. d3 maps a degenerate
     * `[0, 0]` domain to the MIDPOINT of its range, so a pasted table whose value column
     * is all zeros - or one whose value role was mapped to a column that does not parse -
     * would draw every band at half height rather than at none, which reads as data.
     */
    const yScale = d3
      .scaleLinear()
      .domain([0, state.maxStacked || 1])
      .range([bounds.innerHeight, TOP_HEADROOM]);

    const cScale = __C_SCALE__;

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: __TITLE_TEXT__,
        description: __DESCRIPTION__,
      })
      .datum(state.stackedData);

    // {{block:layers}}

    // Components

    const stackedArea = sszvis
      .stackedArea<StackPoint, StackSeries>()
      .key((layer) => layer.key)
      .x((d) => xScale(d.data.xValue))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .fill((layer) => String(cScale(layer.key)));

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues(__X_TICK_VALUES__)
      .tickFormat(xLabelFormat)
      .highlightTick(__HIGHLIGHT_TICK__)
      .alignOuterLabels(true)
      .title(__X_LABEL__);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .contour(true)
      .orient("right")
      .tickValues(yScale.ticks())
      .title(__Y_LABEL__);

    // {{block:components}}

    // Rendering

    chartLayer.selectGroup("areachart").call(stackedArea);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    // {{block:render}}

    // {{block:interaction}}
  },
});

// Helper functions

/**
 * NOTE: `formatAxisTimeFormat` rather than `formatYear`, because a pasted table can
 * span days as easily as decades: formatting every tick as its year turns ten days
 * in November into six ticks all reading 2013.
 */
const xLabelFormat = (d: import("d3").AxisDomain) =>
  d instanceof Date ? sszvis.formatAxisTimeFormat(d) : String(d);

/**
 * Reshape the flat rows into one row per date, with a value per category, which is
 * the shape d3's stack layout consumes.
 *
 * NOTE: A category with no row at a given date contributes nothing rather than
 * throwing: pasted data is not guaranteed to be a complete grid, and a band that
 * is missing a point should thin to zero there rather than take the chart down.
 */
const stackRows = (data: Datum[], categories: string[]): StackRow[] =>
  sszvis
    .cascade<Datum>()
    /*
     * Sorted by date. `arrayBy` groups into a plain object and hands the groups back in
     * first-seen order unless it is given a sorter, so a pasted table whose rows are not
     * already in date order would stack its points out of order and draw an area path
     * that doubles back across itself. The sorter is handed the keys as strings.
     */
    .arrayBy(
      (d) => xAcc(d).getTime(),
      (a, b) => Number(a) - Number(b),
    )
    .objectBy(cAcc)
    .apply<Record<string, Datum[]>[]>(data)
    .map((group) => ({
      xValue: xAcc(Object.values(group)[0][0]),
      values: Object.fromEntries(
        categories.map((c) => {
          const value = group[c]?.[0];
          return [c, value === undefined ? 0 : yAcc(value)];
        }),
      ),
    }));

// {{block:helpers}}
