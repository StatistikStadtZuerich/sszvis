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
/** Lifts the y axis title clear of the topmost tick label. */
const Y_TITLE_OFFSET = -20;
// {{block:magicNumbers}}

// Types

type Datum = {
  xValue: string;
  category: string;
  yValue: number;
};

/** One layer of the stack, as `stackedBarVerticalLayout` hands it over. */
type Series = import("sszvis").StackedBarSeries<Datum>;

/** One slice of one bar: the stacked bounds plus the datum they were built from. */
type Slice = import("sszvis").StackedBarSlice<Datum>;

type State = {
  data: Datum[];
  xValues: string[];
  categories: string[];
  stackedData: Series[];
  maxStacked: number;
  minStacked: number;
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// Responsive Props

/** Typed here so the slant reads as the axis' own union rather than as `string`. */
const X_SLANT = { palm: "vertical", _: "horizontal" } satisfies Record<
  string,
  import("sszvis").SlantDirection
>;

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", { palm: 0.7, _: 0.34 })
  .prop("xSlant", X_SLANT);

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
        xValue: d[__CATEGORY_FIELD__] ?? "",
        category: d[__SERIES_FIELD__] ?? "",
        yValue: sszvis.parseNumber(d[__VALUE_FIELD__]),
      }))
      .then((data) => {
        // NOTE: The layout does the stacking: it returns the keys in layer order,
        // one series per key, and the tallest total, so nothing here has to know
        // how d3's stack is shaped.
        const layout = sszvis.stackedBarVerticalLayout(xAcc, cAcc, yAcc)(data);
        state.data = data;
        state.xValues = sszvis.set(data, xAcc);
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

    const bounds = sszvis.bounds(
      {
        top: 30,
        bottom: __BOTTOM_PADDING__,
        left: sszvis.measureAxisLabel(sszvis.formatNumber(state.maxStacked)),
      },
      config.id,
    );

    // NOTE: While the container is transiently narrower than the left padding the y
    // labels need, innerWidth goes negative, which the layout rejects. Clamping at zero
    // lays out an empty chart until the container has room again.
    const chartDimensions = sszvis.dimensionsVerticalBarChart(
      Math.max(0, Math.min(MAX_WIDTH, bounds.innerWidth)),
      state.xValues.length,
    );

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.xValues)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    /*
     * Both bounds, so a stack that reaches below the baseline is inside the plot. The
     * layout reports `minValue` for exactly this case and the component draws negative
     * slices on the other side of the baseline; a domain starting at zero mapped them
     * off the chart. Stretched to cover zero so the bars stand on the axis.
     *
     * NOTE: A nonzero span when there is nothing to scale. d3 maps a degenerate `[0, 0]`
     * domain to the MIDPOINT of its range, so a pasted table whose value column is all
     * zeros - or one whose value role was mapped to a column that does not parse - would
     * draw every mark at half height rather than at none, which reads as data.
     */
    const valueLow = Math.min(0, state.minStacked);
    const valueHigh = Math.max(0, state.maxStacked);
    const yScale = d3
      .scaleLinear()
      .domain(valueLow === valueHigh ? [0, 1] : [valueLow, valueHigh])
      .range([bounds.innerHeight, 0]);

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

    const stackedBars = sszvis
      .stackedBarVertical<Datum>()
      .xScale(xScale)
      .width(xScale.bandwidth())
      .yScale(yScale)
      .fill(__SLICE_FILL__);

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .slant(props.xSlant)
      .title(__X_LABEL__);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      /* NOTE: A domain that straddles zero needs the zero line drawn: the category axis
         sits at the foot of the plot, so without it a stack reaching below the baseline
         has nothing to be read against. */
      .showZeroY(valueLow !== 0)
      .title(__Y_LABEL__)
      .tickFormat((d) => sszvis.formatNumber(Number(d)))
      .dyTitle(Y_TITLE_OFFSET);

    // {{block:components}}

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(
        bounds.innerWidth / 2 - chartDimensions.totalWidth / 2,
        bounds.padding.top,
      ),
    );

    const bars = chartLayer
      .selectGroup("barchart")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(stackedBars);

    bars
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    // {{block:render}}

    // {{block:interaction}}
  },
});

// {{block:helpers}}
