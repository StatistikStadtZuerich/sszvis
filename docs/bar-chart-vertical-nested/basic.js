/* global d3, sszvis, config */

/* Configuration
  ----------------------------------------------- */
const MAX_CONTROL_WIDTH = 300;

const queryProps = sszvis
  .responsiveProps()
  .prop("targetNumColumns", {
    palm: 1,
    _: 2,
  })
  .prop("bottomPadding", {
    palm: 125,
    _: 100,
  })
  .prop("barPadding", {
    palm: 10,
    _: 12,
  })
  .prop("controlWidth", {
    _(width) {
      return Math.min(width, MAX_CONTROL_WIDTH);
    },
  });

const bvbScale = ["#E22D53", "#2AC7C7", "#009F9D"];

function parseRow(d) {
  return {
    year: d["Jahr_F"],
    xaxis: d["x"],
    button: d["Alter_F"],
    category: d["Auspraegung_F"],
    konfvalue: d["95 % Konfidenzintervall (in %)"],
    value: sszvis.parseNumber(d["Anteil (in %)"]),
    nestedCategory: d["Geschlecht_F"],
  };
}

/* Shortcuts
  ----------------------------------------------- */
const xjAcc = sszvis.prop("year");
const xAcc = sszvis.prop("xaxis");
const bAcc = sszvis.prop("button");
const yAcc = sszvis.prop("value");
const cAcc = sszvis.prop("category");
const aAcc = sszvis.prop("nestedCategory");
const kAcc = sszvis.prop("konfvalue");

/* Application state
  ----------------------------------------------- */
const state = {
  rawData: [],
  data: [],
  years: [],
  nestedCategories: [],
  aAxis: [],
  categories: [],
  stackedData: [],
  maxStacked: 0,
  selection: [],
  selectedFilter: null,
};

/* State transitions
  ----------------------------------------------- */
const actions = {
  prepareState(data) {
    state.rawData = data;
    state.filters = sszvis.set(state.rawData, (d) => bAcc(d));

    actions.selectFilter(null, state.filters[0]);

    render(state);
  },

  showTooltip(e, datum) {
    state.selection = [datum];
    render(state);
  },
  hideTooltip() {
    state.selection = [];
    render(state);
  },

  selectFilter(e, filter) {
    state.selectedFilter = filter;
    state.data = state.rawData.filter((d) => bAcc(d) == state.selectedFilter);
    state.xAxis = sszvis.set(state.data, xAcc);
    state.years = sszvis.set(state.data, xjAcc);

    state.categories = sszvis.set(state.data, cAcc);

    state.stackedData = sszvis
      .cascade()
      .arrayBy(aAcc)
      .apply(state.data)
      .map((d) => {
        const stack = sszvis.stackedBarVerticalData(xjAcc, cAcc, yAcc)(d);
        stack.key = d[0].nestedCategory;
        return stack;
      });

    state.nestedCategories = sszvis.set(state.data, aAcc);

    render(state);
  },

  resize() {
    render(state);
  },
};

/* Data initialization
  ----------------------------------------------- */
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

/* Render
  ----------------------------------------------- */
function render(state) {
  const props = queryProps(sszvis.measureDimensions(config.id));
  const bounds = sszvis.bounds(
    { top: 10, bottom: props.bottomPadding, left: 10, right: 10 },
    config.id
  );

  // Scales

  const xaxis2Scale = d3
    .scaleBand()
    .domain(state.nestedCategories)
    .range([50, bounds.innerWidth])
    .paddingInner(0.2)
    .paddingOuter(0);

  const xScale = d3
    .scaleBand()
    .domain(sszvis.set(state.data, xjAcc))
    .range([0, xaxis2Scale.bandwidth()])
    .paddingInner(0.2)
    .paddingOuter(0);

  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([bounds.innerHeight - 10, 0]);

  const cScale = d3.scaleOrdinal().domain(state.categories).range(bvbScale);

  // Layers

  const chartLayer = sszvis
    .createSvgLayer(config.id, bounds, {
      title: "",
      description: "",
    })
    .datum(state.stackedData);

  const tooltipLayer = sszvis.createHtmlLayer(config.id).datum(state.selection);

  // Components

  const xAxis = sszvis.axisX
    .ordinal()
    .scale(xaxis2Scale)
    .orient("bottom")
    .tickSize(0)
    .tickFormat((d) => d)
    .title(config.xLabel);

  const yAxis = sszvis
    .axisY()
    .scale(yScale)
    .orient("right")
    .title(config.yLabel)
    .ticks(config.ticks)
    .tickFormat((d) => {
      if (d === 0) {
        return sszvis.formatPercent(d);
      }
      return sszvis.formatPercent(d);
    })
    .dyTitle(-20)
    .title("Anteil");

  const colorLegend = sszvis
    .legendColorOrdinal()
    .scale(cScale)
    .rows(state.categories.length / props.targetNumColumns)
    .columnWidth(Math.min(bounds.innerWidth / props.targetNumColumns, 320))
    .columns(props.targetNumColumns)
    .reverse(false)
    .orientation("vertical");

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .header(
      sszvis
        .modularTextHTML()
        .bold((d) => cAcc(d.data))
        .plain("/")
        .plain((d) => xjAcc(d.data))
    )
    .body((d) => [
      ["Anteil", sszvis.formatPercent(yAcc(d.data))],
      ["95 % Konfidenzintervall", kAcc(d.data).replace(" bis", " % bis") + " %"],
    ])
    .visible(isSelected);

  const xaxis2Group = sszvis
    .nestedStackedBarsVertical()
    .offset((d) => xaxis2Scale(d.key))
    .xScale(xScale)
    .xAcc(xjAcc)
    .yScale(yScale)
    .fill((d) => cScale(cAcc(d.data)))
    .tooltip(tooltip);

  // Rendering

  const nestedCategories = chartLayer.selectGroup("age-groups").call(xaxis2Group);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight))
    .call(xAxis)
    .selectAll(".domain")
    .remove();

  chartLayer.selectGroup("yAxis").attr("transform", sszvis.translateString(0, 0)).call(yAxis);

  chartLayer
    .selectGroup("colorLegend")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight + 20))
    .call(colorLegend);

  // Interaction

  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-bar")
    .on("start", actions.showTooltip)
    .on("pan", actions.showTooltip)
    .on("end", actions.hideTooltip);

  nestedCategories.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

/* Helper functions
  ----------------------------------------------- */
function isSelected(d) {
  return sszvis.contains(state.selection, d);
}
