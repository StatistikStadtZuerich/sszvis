/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------
// This example exists to exercise the button group with many options and long,
// multi-word labels: each option only gets `width / values.length` of the
// control's width, so the labels wrap onto several lines inside their buttons.

const MAX_CONTROL_WIDTH = 500;

// Seven sectors with long, multi-word names
const CATEGORIES = [
  "Nahrungsmittel und Papier",
  "Chemie und Metall",
  "Maschinen und Geräte",
  "Wasser und Energie",
  "Gross- und Detailhandel",
  "Immobilien, Informatik",
  "Gesundheits- und Sozialwesen",
];

const queryProps = sszvis.responsiveProps().prop("controlWidth", {
  _: (width) => Math.min(width, MAX_CONTROL_WIDTH),
});

function parseRow(d) {
  return {
    category: d["Sektor"],
    xValue: sszvis.parseNumber(d["Zupendler"]),
  };
}

const xAcc = sszvis.prop("xValue");
const cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  categories: [],
  selectedCategory: CATEGORIES[0],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data.filter((d) => CATEGORIES.includes(cAcc(d)));
    state.categories = sszvis.set(state.data, cAcc);
    render(state);
  },

  selectCategory(_event, category) {
    state.selectedCategory = category;
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
  const bounds = sszvis.bounds(
    { height: 120 + chartDimensions.totalHeight + 40, top: 120, bottom: 40 },
    config.id
  );
  const props = queryProps(bounds);
  const chartWidth = Math.min(bounds.innerWidth, 800);

  // Scales

  const widthScale = d3
    .scaleLinear()
    .range([0, chartWidth])
    .domain([0, d3.max(state.data, xAcc)]);

  const yScale = d3
    .scaleBand()
    .padding(chartDimensions.padRatio)
    .paddingOuter(chartDimensions.outerRatio)
    .rangeRound([0, chartDimensions.totalHeight])
    .domain(state.categories);

  const cScale = sszvis.scaleQual12();
  const cScaleDark = cScale.darker();

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  const controlLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components

  const barGen = sszvis
    .bar()
    .x(0)
    .y(sszvis.compose(yScale, cAcc))
    .width(sszvis.compose(widthScale, xAcc))
    .height(chartDimensions.barHeight)
    .fill((d) => (cAcc(d) === state.selectedCategory ? cScaleDark(d) : cScale(d)));

  const xAxis = sszvis
    .axisX()
    .scale(widthScale)
    .orient("bottom")
    .alignOuterLabels(true)
    .ticks(5);

  const yAxis = sszvis
    .axisY.ordinal()
    .scale(yScale)
    .orient("right")
    .highlightTick((d) => d === state.selectedCategory);

  const buttonGroup = sszvis
    .buttonGroup()
    .values(CATEGORIES)
    .width(props.controlWidth)
    .current(state.selectedCategory)
    .change(actions.selectCategory)
    .ariaLabel("Sektor");

  // Rendering

  chartLayer.attr(
    "transform",
    sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top)
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
    .style("left", Math.max(0, (bounds.innerWidth - buttonGroup.width()) / 2) + "px")
    .style("top", 20 - bounds.padding.top + "px")
    .call(buttonGroup);

  sszvis.viewport.on("resize", actions.resize);
}
