/**
 * Horizontal bar chart whose button group carries long, multi-word labels.
 *
 * @category bar-chart-horizontal
 */

// Magic Numbers

const MAX_WIDTH = 800;
const MAX_CONTROL_WIDTH = 500;
// NOTE: This example exists to exercise the button group with many options and
// long, multi-word labels: each option only gets `width / values.length` of the
// control's width, so the labels wrap onto several lines inside their buttons.
const CATEGORIES = [
  "Nahrungsmittel und Papier",
  "Chemie und Metall",
  "Maschinen und Geräte",
  "Wasser und Energie",
  "Gross- und Detailhandel",
  "Immobilien, Informatik",
  "Gesundheits- und Sozialwesen",
];
// NOTE: One series, so one colour: the categories are already named on the y axis.
const SERIES_KEY = "Zupendler";

// Types

type Datum = {
  category: string;
  xValue: number;
};

type State = {
  data: Datum[];
  categories: string[];
  selectedCategory: string;
};

type Actions = {
  selectCategory: (state: State, e: Event, category: string) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("controlWidth", {
  _: (width: number) => Math.min(width, MAX_CONTROL_WIDTH),
});

// Accessors

const xAcc = (d: Datum) => d.xValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        xValue: sszvis.parseNumber(d["Zupendler"] ?? ""),
      }))
      .then((data) => {
        state.data = data.filter((d) => CATEGORIES.includes(cAcc(d)));
        state.categories = sszvis.set(state.data, cAcc);
        state.selectedCategory = CATEGORIES[0] ?? "";
      }),

  actions: {
    selectCategory(state, _e, category) {
      state.selectedCategory = category;
    },
  },

  render(state, actions) {
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
    const bounds = sszvis.bounds(
      { height: 120 + chartDimensions.totalHeight + 40, top: 120, bottom: 40 },
      config.id,
    );
    const props = queryProps(bounds);
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    const widthScale = d3
      .scaleLinear()
      .range([0, chartWidth])
      .domain([0, d3.max(state.data, xAcc) ?? 0]);

    const yScale = d3
      .scaleBand<string>()
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .rangeRound([0, chartDimensions.totalHeight])
      .domain(state.categories);

    const cScale = sszvis.scaleQual12();
    const barFill = cScale(SERIES_KEY);
    const barFillHighlight = cScale.darker()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Zupendler nach Sektor",
        description: "Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor.",
      })
      .datum(state.data);

    const controlLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x(0)
      .y((d) => yScale(cAcc(d)) ?? 0)
      .width((d) => widthScale(xAcc(d)))
      .height(chartDimensions.barHeight)
      .fill((d) => (cAcc(d) === state.selectedCategory ? barFillHighlight : barFill));

    const xAxis = sszvis.axisX().scale(widthScale).orient("bottom").alignOuterLabels(true).ticks(5);

    const yAxis = sszvis.axisY
      .ordinal()
      .scale(yScale)
      .orient("right")
      .highlightTick((d) => d === state.selectedCategory);

    const buttonGroup = sszvis
      .buttonGroup<string>()
      .values(CATEGORIES)
      .width(props.controlWidth)
      .current(state.selectedCategory)
      .change(actions.selectCategory)
      .ariaLabel("Sektor");

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    chartLayer.selectGroup("bars").call(barGen);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
      .call(yAxis);

    controlLayer
      .selectDiv("controls")
      .style("left", `${Math.max(0, (bounds.innerWidth - buttonGroup.width()) / 2)}px`)
      .style("top", `${20 - bounds.padding.top}px`)
      .call(buttonGroup);
  },
});
