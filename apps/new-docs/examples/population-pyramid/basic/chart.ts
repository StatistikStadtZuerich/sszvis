/**
 * Population pyramid aggregated into five-year age groups.
 *
 * @category population-pyramid
 */

// Magic Numbers

/** Number of single-year age rows that make up one bar of the pyramid. */
const BIN_STEP = 5;
/**
 * The pyramid is laid out 2px narrower than the container so that the outermost
 * bars are not clipped by the edge of the SVG.
 */
const PYRAMID_INSET = 2;
const CHART_PADDING = { top: 25, bottom: 86 };
/** Vertical gap in pixels between the bottom of the chart area and the colour legend. */
const LEGEND_OFFSET = 60;

// Types

type Datum = {
  age: number;
  gender: string;
  value: number;
};

/** One bar of the pyramid: a five-year age range of one gender. */
type BinnedDatum = {
  age: string;
  gender: string;
  value: number;
};

/** The binned rows grouped by gender; the pyramid reads one side out of each key. */
type Populations = Record<string, BinnedDatum[]>;

type State = {
  data: Datum[];
  ages: string[];
  ageExtent: [number, number];
  maxValue: number;
  binnedData: BinnedDatum[];
  populations: Populations;
  /** Maps every single-year age onto the label of the bin it falls into. */
  ageLookupIndex: string[];
  selectedAge: { age: string; rows: BinnedDatum[] } | null;
};

type Actions = {
  selectBar: (state: State, e: Event, xRel: number | null, age: number | null) => void;
  deselectBar: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("tooltipAnchor", {
    palm: [0, 0.5],
    _: [0.5, 0.5],
  })
  .prop("tooltipOrientation", {
    palm: "bottom",
    _: "left",
  })
  // NOTE: An undefined tick count leaves the axis at its own default, which is
  // what every screen but the narrowest wants.
  .prop("xTicks", {
    palm: 4,
    _: undefined,
  });

// Accessors

const vAcc = (d: { value: number }) => d.value;
const gAcc = (d: { gender: string }) => d.gender;
const aAcc = (d: Datum) => d.age;
const binAgeAcc = (d: BinnedDatum) => d.age;
const womenAcc = (p: Populations) => p["Frauen"] ?? [];
const menAcc = (p: Populations) => p["Männer"] ?? [];

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        age: sszvis.parseNumber(d["Alter"] ?? ""),
        gender: d["Geschlecht"] ?? "",
        value: sszvis.parseNumber(d["Anzahl"] ?? ""),
      }))
      .then((data) => {
        const byGender = sszvis
          .cascade<Datum>()
          .objectBy(gAcc)
          // NOTE: the bins are built from contiguous slices of each gender's rows,
          // so those rows have to be in ascending age order first.
          .sort((a, b) => d3.ascending(aAcc(a), aAcc(b)))
          .apply<Record<string, Datum[]>>(data);

        const bins = binByAge(byGender);
        const [minAge = 0, maxAge = 0] = d3.extent(data, aAcc);

        state.data = data;
        state.binnedData = bins.binnedData;
        state.ages = bins.ages;
        state.ageLookupIndex = bins.ageLookupIndex;
        state.populations = sszvis
          .cascade<BinnedDatum>()
          .objectBy(gAcc)
          .apply<Populations>(bins.binnedData);
        // The mouseover behaviour reads a continuous age, so it needs the extent
        // of the raw single-year ages rather than of the bins.
        state.ageExtent = [minAge, maxAge];
        state.maxValue = d3.max(bins.binnedData, vAcc) ?? 0;
        state.selectedAge = null;
      }),

  actions: {
    selectBar(state, _e, _xRel, age) {
      if (age == null) {
        state.selectedAge = null;
        return;
      }
      const ageRange = state.ageLookupIndex[Math.floor(age)];
      state.selectedAge = {
        age: ageRange,
        rows: state.binnedData.filter((d) => binAgeAcc(d) === ageRange),
      };
    },

    deselectBar(state) {
      state.selectedAge = null;
    },
  },

  render(state, actions) {
    const pyramidWidth = (sszvis.measureDimensions(config.id).width ?? 0) - PYRAMID_INSET;
    const pyramidDimensions = sszvis.layoutPopulationPyramid(pyramidWidth, state.ages.length);
    const bounds = sszvis.bounds(
      {
        height: CHART_PADDING.top + pyramidDimensions.totalHeight + CHART_PADDING.bottom,
        top: CHART_PADDING.top,
        bottom: CHART_PADDING.bottom,
        left: pyramidDimensions.chartPadding,
        right: pyramidDimensions.chartPadding,
      },
      config.id,
    );
    const props = queryProps(bounds);

    // Scales

    const lengthScale = d3
      .scaleLinear()
      .domain([0, state.maxValue])
      .range([0, pyramidDimensions.maxBarLength]);

    const colorScale = sszvis.scaleGender3();

    const positionScale = d3
      .scaleOrdinal<string, number>()
      .domain(state.ages)
      .range(pyramidDimensions.positions);

    // NOTE: The y axis uses a copy of the bar position scale shifted down by half a
    // bar, so that the labels sit vertically centred on the bars.
    const yAxisLabelScale = positionScale
      .copy()
      .range(pyramidDimensions.positions.map((d) => d + pyramidDimensions.barHeight / 2));

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Bevölkerung der Stadt Zürich nach Alter und Geschlecht",
        description: "Anzahl Frauen und Männer je Altersgruppe von fünf Jahren.",
      })
      .datum(state.populations);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selectedAge);

    // Components

    const pyramid = sszvis
      .pyramid<Populations, BinnedDatum>()
      .barFill((d) => {
        const barColor = String(colorScale(gAcc(d)));
        return binAgeAcc(d) === state.selectedAge?.age
          ? String(sszvis.slightlyDarker(barColor))
          : barColor;
      })
      .barPosition((d) => positionScale(binAgeAcc(d)))
      .barHeight(pyramidDimensions.barHeight)
      .barWidth((d) => lengthScale(vAcc(d)))
      .tooltipAnchor(props.tooltipAnchor)
      .leftAccessor(womenAcc)
      .rightAccessor(menAcc);

    const xAxis = sszvis.axisX
      .pyramid()
      .scale(lengthScale)
      .orient("bottom")
      .title("Anzahl Frauen und Männer")
      .titleAnchor("middle")
      .titleCenter(true)
      .ticks(props.xTicks);

    const yAxis = sszvis.axisY
      .ordinal()
      .scale(yAxisLabelScale)
      .orient("right")
      .ticks(5)
      .title("Alter in Jahren")
      .dyTitle(-18);

    const colorLegend = sszvis
      .legendColorOrdinal()
      .reverse(true)
      .scale(colorScale)
      .horizontalFloat(true);

    const tooltip = sszvis
      .tooltip<BinnedDatum>()
      .renderInto(tooltipLayer)
      .header((d) => `${binAgeAcc(d)}-jährige`)
      .body(() => {
        const selected = state.selectedAge;
        if (selected === null) {
          return [];
        }
        return [
          ...selected.rows.map((r) => [gAcc(r), sszvis.formatNumber(vAcc(r))]),
          ["Alter", selected.age],
        ];
      })
      .orientation(props.tooltipOrientation)
      // NOTE: Both sides of a bin share an age range, so only one of them may own
      // the tooltip; otherwise two tooltips would be shown for one selection.
      .visible((d) => state.selectedAge?.age === binAgeAcc(d) && gAcc(d) === "Männer");

    // Rendering

    chartLayer
      .selectGroup("populationPyramid")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2, 0))
      .call(pyramid);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + LEGEND_OFFSET))
      .call(colorLegend);

    // Interaction

    const mouseXScale = d3.scaleLinear().domain([0, 1]).range([0, bounds.innerWidth]);
    // NOTE: A continuous scale for the vertical mouse position keeps the tooltip
    // from flickering: an ordinal scale has no value in the gaps between bars,
    // where a linear one still reports an age.
    const mouseYScale = d3.scaleLinear().domain(state.ageExtent).range([bounds.innerHeight, 0]);

    const interactionLayer = sszvis
      .move<number, number>()
      .xScale(mouseXScale)
      .yScale(mouseYScale)
      .cancelScrolling(isWithinBarContour(state, bounds.innerWidth / 2, mouseXScale, lengthScale))
      .fireOnPanOnly(true)
      .on("move", actions.selectBar)
      .on("end", actions.deselectBar);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/**
 * Aggregates the single-year rows of each gender into five-year bins, and builds
 * the lookup table that turns a continuous age back into a bin label.
 */
const binByAge = (
  byGender: Record<string, Datum[]>,
): { binnedData: BinnedDatum[]; ages: string[]; ageLookupIndex: string[] } => {
  const binnedData: BinnedDatum[] = [];
  const ages: string[] = [];
  // NOTE: One entry per single year of age. A gender missing rows for some ages
  // would leave holes here, since every gender writes into the same index.
  const ageLookupIndex: string[] = [];

  for (const [gender, rows] of Object.entries(byGender)) {
    for (let i = 0; i < rows.length; i += BIN_STEP) {
      const label = `${aAcc(rows[i])}–${aAcc(rows[i + BIN_STEP - 1])}`;
      ages.push(label);
      binnedData.push({
        age: label,
        gender,
        value: d3.sum(rows.slice(i, i + BIN_STEP), vAcc),
      });
      for (let age = i; age < i + BIN_STEP; age++) {
        ageLookupIndex[aAcc(rows[age])] = label;
      }
    }
  }

  return { binnedData, ages: [...new Set(ages)], ageLookupIndex };
};

/**
 * On touch devices, scrolling is cancelled only while the cursor is inside the
 * contour of the pyramid, so that a pan gesture over the bars reads as a tooltip
 * query while a pan beside them still scrolls the page.
 */
const isWithinBarContour =
  (
    state: State,
    xCenter: number,
    xRelToPx: (xRel: number) => number,
    lengthScale: (value: number) => number,
  ) =>
  (xRel: number | null, age: number | null) => {
    if (xRel == null || age == null) {
      return false;
    }
    const ageBin = state.ageLookupIndex[Math.floor(age)];
    const binRows = state.binnedData.filter((d) => binAgeAcc(d) === ageBin);
    const x = xRelToPx(xRel);
    return sszvis.every(
      (d: BinnedDatum) =>
        gAcc(d) === "Frauen"
          ? x >= xCenter - lengthScale(vAcc(d))
          : x <= xCenter + lengthScale(vAcc(d)),
      binRows,
    );
  };
