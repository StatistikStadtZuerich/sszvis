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

/** Vertical offset of the y axis title, in pixels. */
const Y_TITLE_OFFSET = -20;
/** Top padding when the chart has a y axis title, and when it has none. */
const TOP_PADDING_WITH_TITLE = 30;
const TOP_PADDING_WITHOUT_TITLE = 10;
// {{block:magicNumbers}}

// Types

/** d3's tick-value type: what an axis hands its `tickFormat`. */
type AxisDomain = import("d3").AxisDomain;
// {{block:types}}

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
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: __X_LABEL__ })
  .prop("yLabel", { _: __Y_LABEL__ })
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
        const xValue = sszvis.parseDate(d[__DATE_FIELD__]);
        // NOTE: A row whose date cannot be parsed has no position on the time
        // axis; returning null from the row callback drops it from the data.
        return xValue === null
          ? null
          : {
              xValue,
              yValue: sszvis.parseNumber(d[__VALUE_FIELD__]),
              category: __CATEGORY_EXPR__,
            };
      })
      .then((data) => {
        state.data = data;
        // NOTE: One array of points per category; the line component draws each.
        state.lineData = sszvis.cascade<Datum>().arrayBy(cAcc, d3.ascending).apply<Datum[][]>(data);
        state.xValues = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        state.categories = sszvis.set(data, cAcc);
        state.maxY = d3.max(data, yAcc) ?? 0;
        // {{block:init}}
      }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    // {{block:preBounds}}

    const cScale = __C_SCALE__;

    const bounds = sszvis.bounds(
      {
        top: props.yLabel.length > 0 ? TOP_PADDING_WITH_TITLE : TOP_PADDING_WITHOUT_TITLE,
        bottom: __BOTTOM_PADDING__,
      },
      config.id,
    );

    // Scales

    const xScale = d3.scaleTime().domain(state.xValues).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain([0, state.maxY]).range([bounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: __TITLE_TEXT__,
        description: __DESCRIPTION__,
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

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .ticks(props.ticks)
      .tickFormat(xLabelFormat)
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

    // {{block:components}}

    // Rendering

    chartLayer.selectGroup("line").call(line);

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

/** Axis labels are years; sub-annual data is shown by the year it falls in. */
const xLabelFormat = (d: AxisDomain) => (d instanceof Date ? sszvis.formatYear(d) : String(d));

/** The zero tick is drawn by the axis itself, so it carries no label. */
const yLabelFormat = (d: AxisDomain) => (d === 0 ? null : sszvis.formatNumber(Number(d)));

// {{block:helpers}}
