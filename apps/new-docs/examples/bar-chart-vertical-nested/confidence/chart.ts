/**
 * Grouped vertical bar chart with 95% confidence bars.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-vertical-nested
 * @features tooltip, confidence, legend
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** Width in pixels of the horizontal caps at the ends of a confidence bar. */
const CONFIDENCE_CAP_WIDTH = 8;
/** Headroom above the tallest bar, so its upper confidence cap stays visible. */
const Y_DOMAIN_HEADROOM = 1.1;
/** Distance in pixels between the x axis and the colour legend below it. */
const LEGEND_GUTTER = 60;
// NOTE: The survey repeats over several years and both genders; one chart shows
// one slice of it, and stacking the rest would mix populations.
const SELECTED_YEAR = "2021";
const SELECTED_GENDER = "Weiblich";

// Types

type Datum = {
  ageGroup: string;
  gender: string;
  response: string;
  value: number;
  confidenceLower: number | null;
  confidenceUpper: number | null;
  year: string;
};

type State = {
  data: Datum[];
  filteredData: Datum[];
  ageGroups: string[];
  responses: string[];
  groupedData: Datum[][];
  longestGroup: number;
  selection: Datum | null;
};

type Actions = {
  showTooltip: (state: State, e: Event, datum: Datum) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bottomPadding", { palm: 140, _: 120 })
  .prop("leftPadding", { palm: 40, _: 20 })
  .prop("rightPadding", { _: 20 });

// Accessors

const xAcc = (d: Datum) => d.ageGroup;
const yAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.response;
const genderAcc = (d: Datum) => d.gender;
const lowAcc = (d: Datum) => d.confidenceLower;
const highAcc = (d: Datum) => d.confidenceUpper;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => {
        const confidence = parseConfidenceInterval(d["95 % Konfidenzintervall (in %)"] ?? "");
        return {
          ageGroup: d["Alter_F"] ?? "",
          gender: d["Geschlecht_F"] ?? "",
          response: d["Auspraegung_F"] ?? "",
          value: sszvis.parseNumber(d["Anteil (in %)"]),
          confidenceLower: confidence.lower,
          confidenceUpper: confidence.upper,
          year: d["Jahr_F"] ?? "",
        };
      })
      .then((data) => {
        const filtered = data.filter(
          (d) => d.year === SELECTED_YEAR && genderAcc(d) === SELECTED_GENDER,
        );
        state.data = data;
        state.filteredData = filtered;
        state.ageGroups = sszvis.set(data, xAcc);
        state.responses = sszvis.set(data, cAcc);
        state.groupedData = sszvis.cascade<Datum>().arrayBy(xAcc).apply<Datum[][]>(filtered);
        state.longestGroup = d3.max(state.groupedData, (group) => group.length) ?? 0;
        state.selection = null;
      }),

  actions: {
    showTooltip(state, _e, datum) {
      state.selection = datum;
    },

    hideTooltip(state) {
      state.selection = null;
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    // NOTE: The legend layout is what gives the bars and the legend swatches the
    // same colour scale.
    const legendLayout = sszvis.colorLegendLayout(
      { axisLabels: state.ageGroups, legendLabels: state.responses },
      config.id,
    );

    const yMax = d3.max(state.filteredData, yAcc) ?? 0;
    const bounds = sszvis.bounds(
      {
        top: 30,
        bottom: props.bottomPadding,
        left: props.leftPadding,
        right: props.rightPadding,
      },
      config.id,
    );

    const chartWidth = Math.min(MAX_WIDTH, bounds.innerWidth);

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.ageGroups)
      .range([0, chartWidth])
      .paddingOuter(0.2)
      .padding(0.26);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * Y_DOMAIN_HEADROOM])
      .range([bounds.innerHeight, 0]);

    const colorScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: `Einschätzung nach Altersgruppe, ${SELECTED_GENDER}, ${SELECTED_YEAR}`,
      description: "Anteil der Antworten je Altersgruppe, mit 95%-Konfidenzintervall.",
    });

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barLayout = sszvis
      .groupedBarsVertical<Datum>()
      .groupScale((d) => xScale(xAcc(d)))
      .groupWidth(xScale.bandwidth())
      .groupSize(state.longestGroup)
      .y((d) => yScale(yAcc(d)))
      .height((d) => bounds.innerHeight - yScale(yAcc(d)))
      .fill((d) => colorScale(cAcc(d)))
      .defined((d) => !Number.isNaN(yAcc(d)));

    const confidenceBars = sszvis
      .annotationConfidenceBar<Datum>()
      .groupScale((d) => xScale(xAcc(d)) ?? 0)
      .groupWidth(xScale.bandwidth())
      .groupSize(state.longestGroup)
      .confidenceLow((d) => yScale(lowAcc(d) ?? 0))
      .confidenceHigh((d) => yScale(highAcc(d) ?? 0))
      .width(CONFIDENCE_CAP_WIDTH);

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .slant("diagonal")
      .highlightTick((d) => state.selection !== null && xAcc(state.selection) === d);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("left")
      .title("Anteil (in %)")
      .tickFormat((d) => `${d}%`);

    const tooltipHeader = sszvis.modularTextHTML().plain((d: Datum) => `${xAcc(d)} - ${cAcc(d)}`);

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .body((d) => [["Wert", formatValueWithConfidence(d)]])
      .visible((d) => state.selection === d);

    // Rendering

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    const bars = chartLayer.selectGroup("bars").datum(state.groupedData).call(barLayout);

    chartLayer.selectGroup("confidenceBars").datum(state.groupedData).call(confidenceBars);

    // Interaction

    bars
      .selectAll(".sszvis-barunit rect")
      .on("mouseover", actions.showTooltip)
      .on("mouseout", actions.hideTooltip)
      .call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + LEGEND_GUTTER))
      .call(colorLegend);
  },
});

// Helper functions

/** Parses a "X bis Y" confidence interval; an empty or malformed cell has no bounds. */
const parseConfidenceInterval = (confidence: string) => {
  const parts = confidence.split(" bis ");
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    return { lower: null, upper: null };
  }
  return { lower: sszvis.parseNumber(parts[0]), upper: sszvis.parseNumber(parts[1]) };
};

/**
 * The share, with its confidence interval written as the distance to each bound
 * rather than as two absolute percentages.
 */
const formatValueWithConfidence = (d: Datum) => {
  const value = yAcc(d);
  if (Number.isNaN(value)) {
    return "–";
  }
  const low = lowAcc(d);
  const high = highAcc(d);
  if (low == null || high == null) {
    return `${value.toFixed(1)}%`;
  }
  return `${value.toFixed(1)}% (${(low - value).toFixed(0)}/+${(high - value).toFixed(0)})`;
};
