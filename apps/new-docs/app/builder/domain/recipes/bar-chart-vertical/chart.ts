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
// NOTE: One series, so one colour: the categories are already named on the x axis.
const SERIES_KEY = __SERIES_KEY__;
// {{block:magicNumbers}}

// Types

type Datum = {
  category: string;
  yValue: number;
};

type State = {
  data: Datum[];
  categories: string[];
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// Responsive Props

/** Typed here so the slant reads as the axis' own union rather than as `string`. */
const SLANT: { palm: import("sszvis").SlantDirection; _: import("sszvis").SlantDirection } = {
  palm: "vertical",
  _: "horizontal",
};

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", { palm: 0.4, _: 0.2 })
  .prop("bottomPadding", { palm: 140, _: 60 })
  .prop("slant", SLANT);

// Accessors

const xAcc = (d: Datum) => d.category;
const yAcc = (d: Datum) => d.yValue;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d[__CATEGORY_FIELD__] ?? "",
        yValue: sszvis.parseNumber(d[__VALUE_FIELD__]),
      }))
      .then((data) => {
        state.data = data;
        // {{block:init}}
        // NOTE: One band per distinct category. `scaleBand` interns its domain,
        // so counting the rows instead would lay the chart out for more bars
        // than are ever drawn. Rows repeating a category still share a band:
        // they are drawn on top of each other and the tooltip names them all.
        state.categories = sszvis.set(state.data, xAcc);
      }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const yMax = d3.max(state.data, yAcc) ?? 0;
    const bounds = sszvis.bounds(
      {
        top: 3,
        bottom: props.bottomPadding,
        left: sszvis.measureAxisLabel(sszvis.formatNumber(yMax)),
      },
      config.id,
    );
    // NOTE: While the container is transiently narrower than the left padding the y
    // labels need, innerWidth goes negative, which the layout rejects. Clamping at zero
    // lays out an empty chart until the container has room again.
    const chartDimensions = sszvis.dimensionsVerticalBarChart(
      Math.max(0, Math.min(MAX_WIDTH, bounds.innerWidth)),
      state.categories.length,
    );

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.categories)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    const heightScale = d3.scaleLinear().domain([0, yMax]).range([0, bounds.innerHeight]);

    const yPosScale = heightScale.copy().range([...heightScale.range()].reverse());

    const cScale = sszvis.scaleQual12();
    const _barFill = cScale(SERIES_KEY);
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
      .x((d) => xScale(xAcc(d)) ?? 0)
      // NOTE: A bar with no value is parked on the baseline rather than being
      // positioned from a NaN, which would write an invalid attribute.
      .y((d) => {
        const yPos = yPosScale(yAcc(d));
        return Number.isNaN(yPos) ? (yPosScale.range()[0] ?? 0) : yPos;
      })
      // NOTE: Because we use sszvis.move in this example, the bars have to be
      // exactly as wide as the scale's bandwidth.
      .width(xScale.bandwidth())
      .height((d) => heightScale(yAcc(d)))
      .centerTooltip(true)
      .fill(__BAR_FILL__);

    const xAxis = sszvis.axisX.ordinal().scale(xScale).orient("bottom").slant(props.slant);

    if (props.slant === "horizontal") {
      xAxis.textWrap(xScale.step());
    }

    const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

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
      .selectGroup("bars")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(barGen);

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
