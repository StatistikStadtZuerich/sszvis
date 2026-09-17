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
// {{block:magicNumbers}}

// Types

type Datum = {
  xValue: string;
  category: string;
  yValue: number;
};

type State = {
  data: Datum[];
  xValues: string[];
  categories: string[];
  valueExtent: [number, number];
  groupedData: Datum[][];
  longestGroup: number;
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// {{block:types}}

// Responsive Props

/** Typed here so the slant reads as the axis' own union rather than as `string`. */
const TEXT_DIRECTION = { _: "diagonal" } satisfies Record<string, import("sszvis").SlantDirection>;

const queryProps = sszvis.responsiveProps().prop("textDirection", TEXT_DIRECTION);

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
        state.data = data;
        state.xValues = sszvis.set(data, xAcc);
        state.categories = sszvis.set(data, cAcc);
        // NOTE: The domain is stretched to zero so the bars stand on the axis
        // rather than on the smallest value, and so negative values get a side.
        const [low = 0, high = 0] = d3.extent(data, yAcc);
        state.valueExtent = [Math.min(0, low), Math.max(0, high)];
        state.groupedData = sszvis.cascade<Datum>().arrayBy(xAcc).apply<Datum[][]>(data);
        state.longestGroup = d3.max(state.groupedData, (group) => group.length) ?? 0;
        // {{block:init}}
      }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    // {{block:preBounds}}

    const bounds = sszvis.bounds({ top: 25, bottom: __BOTTOM_PADDING__ }, config.id);
    const chartWidth = Math.min(MAX_WIDTH, bounds.innerWidth);

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.xValues)
      .padding(0.26)
      .paddingOuter(0.8)
      .rangeRound([0, chartWidth]);

    /*
     * NOTE: A nonzero span when there is nothing to scale. The extent already covers zero,
     * so it collapses to `[0, 0]` only when every value is zero or unparseable - and d3
     * maps a degenerate domain to the MIDPOINT of its range, which would stand every bar
     * at half height rather than at none. `|| 1` is not enough here: the extent's upper
     * bound is legitimately 0 whenever the data is all negative.
     */
    const [valueLow, valueHigh] = state.valueExtent;
    const yScale = d3
      .scaleLinear()
      .domain(valueLow === valueHigh ? [0, 1] : state.valueExtent)
      .range([bounds.innerHeight, 0]);

    // NOTE: The values can be negative, so a bar starts at the higher of its
    // value and zero, and is as tall as the distance between the two.
    const yPosScale = (v: number) => (Number.isNaN(v) ? yScale(0) : yScale(Math.max(v, 0)));
    const hScale = (v: number) => Math.abs(yScale(v) - yScale(0));

    const cScale = __C_SCALE__;

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: __TITLE_TEXT__,
        description: __DESCRIPTION__,
      })
      .datum(state.groupedData);

    // {{block:layers}}

    // Components

    const barLayout = sszvis
      .groupedBarsVertical<Datum>()
      .groupScale((d) => xScale(xAcc(d)))
      .groupWidth(xScale.bandwidth())
      .groupSize(state.longestGroup)
      .y((d) => yPosScale(yAcc(d)))
      .height((d) => hScale(yAcc(d)))
      .fill((d) => cScale(cAcc(d)))
      .defined((d) => !Number.isNaN(yAcc(d)));

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .slant(props.textDirection)
      .highlightTick(__HIGHLIGHT_TICK__)
      .title(__X_LABEL__);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      // NOTE: A domain that straddles zero needs the zero line drawn.
      .showZeroY((d3.min(state.valueExtent) ?? 0) !== 0)
      .title(__Y_LABEL__);

    // {{block:components}}

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    const bars = chartLayer.selectGroup("bars").call(barLayout);

    // {{block:render}}

    // {{block:interaction}}
  },
});

// {{block:helpers}}
