/**
 * Nested stacked bar chart: one stacked chart per nested category.
 *
 * @category bar-chart-vertical-nested
 */

// Magic Numbers

// NOTE: The source data breaks every share down by age as well as by year,
// gender and answer, and the shares within one age group sum to 100%. Stacking
// across age groups would therefore add percentages that do not belong in one
// bar, so the example shows a single age group. Change AGE_GROUP to show
// another one.
const AGE_GROUP = "18 bis 29 Jahre";
/** Room in pixels reserved on the left for the y axis labels. */
const NESTED_LEFT_OFFSET = 50;
/** Keeps the topmost bar clear of the upper edge of the chart area. */
const TOP_GUTTER = 10;
/** Left and right padding of the chart area, in pixels. */
const SIDE_PADDING = 10;
/** Distance in pixels between the x axis and the colour legend below it. */
const LEGEND_GUTTER = 20;
/** Lifts the y axis title clear of the topmost tick label. */
const Y_TITLE_OFFSET = -20;

// Types

type Datum = {
  year: string;
  category: string;
  konfvalue: string;
  value: number;
  nestedCategory: string;
  ageGroup: string;
};

/** One nested group's stack layout, tagged with the key it was cascaded by. */
type NestedStack = import("sszvis").StackedBarSeriesData<Datum>;

/** One slice of one bar: the stacked bounds plus the datum they were built from. */
type Slice = import("sszvis").StackedBarSlice<Datum>;

type State = {
  data: Datum[];
  nestedCategories: string[];
  categories: string[];
  stackGroup: string[];
  stackedData: NestedStack[];
  selection: Slice[];
};

type Actions = {
  showTooltip: (state: State, e: Event, slice: Slice) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("bottomPadding", { palm: 125, _: 100 });

// Accessors

const xAcc = (d: Datum) => d.year;
const yAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.category;
const aAcc = (d: Datum) => d.nestedCategory;
const kAcc = (d: Datum) => d.konfvalue;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        year: d["Jahr_F"] ?? "",
        category: d["Auspraegung_F"] ?? "",
        konfvalue: d["95 % Konfidenzintervall (in %)"] ?? "",
        value: sszvis.parseNumber(d["Anteil (in %)"]),
        nestedCategory: d["Geschlecht_F"] ?? "",
        ageGroup: d["Alter_F"] ?? "",
      }))
      .then((data) => {
        const rows = data.filter((d) => d.ageGroup === AGE_GROUP);
        const stackLayout = sszvis.stackedBarVerticalData(xAcc, cAcc, yAcc);

        state.data = rows;
        state.stackedData = sszvis
          .cascade<Datum>()
          .arrayBy(aAcc)
          .apply<Datum[][]>(rows)
          .map((group) => {
            const stack = stackLayout(group);
            stack.key = group[0] === undefined ? "" : aAcc(group[0]);
            return stack;
          });
        state.categories = sszvis.set(rows, xAcc);
        state.nestedCategories = sszvis.set(rows, aAcc);
        state.stackGroup = sszvis.set(rows, cAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, slice) {
      state.selection = [slice];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      { axisLabels: state.categories, legendLabels: state.stackGroup },
      config.id,
    );

    const bounds = sszvis.bounds(
      {
        top: TOP_GUTTER,
        bottom: props.bottomPadding,
        left: SIDE_PADDING,
        right: SIDE_PADDING,
      },
      config.id,
    );

    // Scales

    // NOTE: The outer scale positions one nested chart per category; the inner
    // scale positions the stacks within one of them.
    const nestedScale = d3
      .scaleBand<string>()
      .domain(state.nestedCategories)
      .range([NESTED_LEFT_OFFSET, bounds.innerWidth])
      .paddingInner(0.2)
      .paddingOuter(0);

    const xScale = d3
      .scaleBand<string>()
      .domain(state.categories)
      .range([0, nestedScale.bandwidth()])
      .paddingInner(0.2)
      .paddingOuter(0);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([bounds.innerHeight - TOP_GUTTER, 0]);

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Beschäftigte nach Berufsfeld und Jahr",
        description: `Anteile der Antworten je Geschlecht, Altersgruppe ${AGE_GROUP}.`,
      })
      .datum(state.stackedData);

    const tooltipLayer = sszvis.createHtmlLayer(config.id).datum(state.selection);

    // Components

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(nestedScale)
      .orient("bottom")
      .tickSize(0)
      .tickFormat((d) => String(d));

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .tickFormat((d) => sszvis.formatPercent(Number(d)))
      .dyTitle(Y_TITLE_OFFSET)
      .title("Anteil");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((slice: Slice) => (slice.data === undefined ? "" : cAcc(slice.data)))
      .plain("/")
      .plain((slice: Slice) => (slice.data === undefined ? "" : xAcc(slice.data)));

    const tooltip = sszvis
      .tooltip<Slice>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .body((slice) =>
        slice.data === undefined
          ? []
          : [
              ["Anteil", sszvis.formatPercent(yAcc(slice.data))],
              ["95 % Konfidenzintervall", `${kAcc(slice.data).replace(" bis", " % bis")} %`],
            ],
      )
      .visible((slice) => sszvis.contains(state.selection, slice));

    const nestedBars = sszvis
      .nestedStackedBarsVertical<Datum>()
      .offset((stack: NestedStack) => nestedScale(String(stack.key)))
      .xScale(xScale)
      .yScale(yScale)
      .fill((slice) => (slice.data === undefined ? "" : cScale(cAcc(slice.data))))
      .tooltip(tooltip);

    // Rendering

    const nestedCategories = chartLayer.selectGroup("age-groups").call(nestedBars);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis)
      .selectAll(".domain")
      .remove();

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + LEGEND_GUTTER))
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .panning<Slice>()
      .elementSelector(".sszvis-bar")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    nestedCategories.call(interactionLayer);
  },
});
