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
// NOTE: One series, so one colour: the categories are already named on the y axis.
const SERIES_KEY = __SERIES_KEY__;
// {{block:magicNumbers}}

// Types

type Datum = {
  category: string;
  xValue: number;
};

type State = {
  data: Datum[];
  categories: string[];
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: __X_LABEL__ })
  .prop("ticks", { palm: 4, _: 5 });

// Accessors

/*
 * The value runs along x here and the category down y, which is the whole
 * difference from the vertical chart: `xAcc` reads the number, not the label.
 */
const xAcc = (d: Datum) => d.xValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d[__CATEGORY_FIELD__] ?? "",
        xValue: sszvis.parseNumber(d[__VALUE_FIELD__]),
      }))
      .then((data) => {
        state.data = data;
        // {{block:init}}
        // NOTE: One band per distinct category. `scaleBand` interns its domain,
        // so counting the rows instead would lay the chart out for more bars
        // than are ever drawn. Rows repeating a category still share a band:
        // they are drawn on top of each other and the tooltip names them all.
        state.categories = sszvis.set(state.data, cAcc);
      }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const xMax = d3.max(state.data, xAcc) ?? 0;
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
    const bounds = sszvis.bounds(
      {
        height: 30 + chartDimensions.totalHeight + 40,
        top: 30,
        bottom: 40,
      },
      config.id,
    );
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    /*
     * NOTE: A nonzero upper bound when there is nothing to scale. d3 maps a degenerate
     * `[0, 0]` domain to the MIDPOINT of its range, so a pasted table whose value column
     * is all zeros - or one whose value role was mapped to a column that does not parse -
     * would draw every mark at half width rather than at none, which reads as data.
     */
    const widthScale = d3
      .scaleLinear()
      .domain([0, xMax || 1])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleBand<string>()
      .domain(state.categories)
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .rangeRound([0, chartDimensions.totalHeight]);

    const cScale = sszvis.scaleQual12();
    const barFill = cScale(SERIES_KEY);
    // {{block:colors}}

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: __TITLE_TEXT__,
        description: __DESCRIPTION__,
      })
      .datum(state.data);

    // {{block:layers}}

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x(0)
      .y((d) => yScale(cAcc(d)) ?? 0)
      // NOTE: A bar with no value is drawn with no width rather than from a NaN,
      // which would write an invalid attribute.
      .width((d) => {
        const width = widthScale(xAcc(d));
        return Number.isNaN(width) ? 0 : width;
      })
      .height(chartDimensions.barHeight)
      .centerTooltip(true)
      .fill(__BAR_FILL__);

    const xAxis = sszvis
      .axisX()
      .scale(widthScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(props.ticks)
      .title(props.xLabel);

    // NOTE: Oriented right, so the category labels are drawn over the bars
    // rather than in a gutter that a long name would overflow.
    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    // {{block:components}}

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    const bars = chartLayer.selectGroup("bars").call(barGen);

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
