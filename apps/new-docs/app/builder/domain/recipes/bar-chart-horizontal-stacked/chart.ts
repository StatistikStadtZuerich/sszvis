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

const MAX_WIDTH = 800;
const PADDING_TOP = 20;
// {{block:magicNumbers}}

// Types

type Datum = {
  category: string;
  yValue: string;
  xValue: number;
};

/** One layer of the stack, as `stackedBarHorizontalLayout` hands it over. */
type Series = import("sszvis").StackedBarSeries<Datum>;

/** One slice of one bar: the stacked bounds plus the datum they were built from. */
type Slice = import("sszvis").StackedBarSlice<Datum>;

type State = {
  data: Datum[];
  yValues: string[];
  categories: string[];
  stackedData: Series[];
  maxStacked: number;
  minStacked: number;
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("ticks", { palm: 3, _: 4 });

// Accessors

/*
 * The value runs along x and the bar's own category down y, as in the plain
 * horizontal chart; `cAcc` is the slice's series, which is the third dimension.
 */
const xAcc = (d: Datum) => d.xValue;
const yAcc = (d: Datum) => d.yValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        yValue: d[__CATEGORY_FIELD__] ?? "",
        category: d[__SERIES_FIELD__] ?? "",
        xValue: sszvis.parseNumber(d[__VALUE_FIELD__]),
      }))
      .then((data) => {
        // NOTE: The layout does the stacking: it returns the keys in layer order,
        // one series per key, and the widest total, so nothing here has to know
        // how d3's stack is shaped.
        const layout = sszvis.stackedBarHorizontalLayout(yAcc, cAcc, xAcc)(data);
        state.data = data;
        state.yValues = sszvis.set(data, yAcc);
        state.categories = layout.keys;
        state.stackedData = layout.series;
        state.maxStacked = layout.maxValue;
        state.minStacked = layout.minValue;
        // {{block:init}}
      }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    // {{block:preBounds}}

    // NOTE: The height and the bottom padding both depend on how many rows the
    // legend needed, so the legend is laid out before the bounds it feeds.
    const bottomPadding = __BOTTOM_PADDING__;
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.yValues.length);
    const bounds = sszvis.bounds(
      {
        height: PADDING_TOP + chartDimensions.totalHeight + bottomPadding,
        top: PADDING_TOP,
        bottom: bottomPadding,
      },
      config.id,
    );
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    /*
     * Both bounds, so a stack that reaches left of the baseline is inside the plot. The
     * layout reports `minValue` for exactly this case and the component draws negative
     * slices on the other side of the baseline; a domain starting at zero mapped them
     * off the chart. Stretched to cover zero so the bars stand on the axis.
     *
     * NOTE: A nonzero span when there is nothing to scale. d3 maps a degenerate `[0, 0]`
     * domain to the MIDPOINT of its range, so a pasted table whose value column is all
     * zeros - or one whose value role was mapped to a column that does not parse - would
     * draw every mark at half width rather than at none, which reads as data.
     */
    const valueLow = Math.min(0, state.minStacked);
    const valueHigh = Math.max(0, state.maxStacked);
    const xScale = d3
      .scaleLinear()
      .domain(valueLow === valueHigh ? [0, 1] : [valueLow, valueHigh])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleBand<string>()
      .domain(state.yValues)
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .range([0, chartDimensions.totalHeight]);

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

    const horizontalBars = sszvis
      .stackedBarHorizontal<Datum>()
      .xScale(xScale)
      .height(chartDimensions.barHeight)
      .yScale(yScale)
      .fill(__SLICE_FILL__);

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .title(__X_LABEL__)
      .alignOuterLabels(true)
      .ticks(props.ticks);

    // NOTE: Oriented right, so the bar labels are drawn over the bars rather
    // than in a gutter that a long name would overflow.
    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    // {{block:components}}

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    const bars = chartLayer.selectGroup("barchart").call(horizontalBars);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
      .call(yAxis);

    // {{block:render}}

    // {{block:interaction}}
  },
});

// {{block:helpers}}
