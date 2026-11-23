/**
 * Stacked area chart that can be split into small multiples, one band per category.
 *
 * @sszvis   3.5.1
 * @chart    area-chart-stacked
 * @features tooltip, ruler, range-flag, legend, button-group, small-multiples
 * @date     2026-09-14
 */

// Magic Numbers

/** Widest the button group is allowed to get, in pixels. */
const MAX_CONTROL_WIDTH = 300;
/** Vertical space in pixels reserved above the chart for the button group. */
const CONTROL_HEIGHT = 70;
/** Distance in pixels from the top of the chart container to the button group. */
const CONTROL_TOP = 20;
/** Share of each multiple's step that is left empty between the bands. */
const MULTIPLES_PAD_RATIO = 0.1;
/** Number of ticks on the x axis, before the highlighted date is added to them. */
const X_TICKS = 5;
const SUMMED = "Summiert";
const SEPARATED = "Separiert";

// Types

type Datum = {
  category: string;
  year: Date;
  value: number;
};

/** One date's worth of data, shaped the way d3's stack layout wants it. */
type StackRow = {
  year: Date;
  /** One entry per category, keyed by category name. */
  values: Record<string, number>;
};

/**
 * A point on one band. The category key is carried on the point as well as on the
 * band, because the multiples components position each point by its own category.
 */
type BandPoint = {
  0: number;
  1: number;
  data: StackRow;
  key: string;
};

/** One band of the stack: its points, plus the category they all belong to. */
type Band = BandPoint[] & { key: string };

type State = {
  data: Datum[];
  timeExtent: [Date, Date];
  stackedData: Band[];
  /** The largest single value, which sets the height of one multiples band. */
  maxValue: number;
  /** The largest summed value, which sets the height of the summed chart. */
  maxStacked: number;
  categories: string[];
  dates: Date[];
  isMultiples: boolean;
  highlightDate: Date;
  highlightData: BandPoint[];
  totalHighlightValue: number;
  /** The pointer's y position, in the y scale's own domain units. */
  mouseYValue: number;
};

type Actions = {
  toggleMultiples: (state: State, e: Event, value: string) => void;
  changeDate: (
    state: State,
    e: Event,
    xValue: Date | number | string | null,
    yValue: number | string | null,
  ) => void;
  resetDate: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("controlWidth", { _: (width: number) => Math.min(width, MAX_CONTROL_WIDTH) })
  .prop("xLabelFormat", { _: () => sszvis.formatYear });

// Accessors

const xAcc = (d: Datum) => d.year;
const yAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      // NOTE: A row whose year cannot be parsed is skipped - returning null from a
      // d3 row callback drops the row - because every band is positioned by date.
      .csv(config.data, (d) => {
        const year = sszvis.parseYear(d["Jahr"]);
        return year === null
          ? null
          : {
              category: d["Nationalität"] ?? "",
              year,
              value: sszvis.parseNumber(d["Anzahl"]),
            };
      })
      .then((data) => {
        const categories = sszvis.set(data, cAcc);
        const rows = stackRows(data, categories);

        state.data = data;
        state.categories = categories;
        state.dates = sszvis.set(data, xAcc);
        state.timeExtent = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        state.stackedData = stackBands(rows, categories);
        state.maxValue = d3.max(data, yAcc) ?? 0;
        state.maxStacked = d3.max(rows, (row) => d3.sum(categories, (c) => row.values[c])) ?? 0;
        state.isMultiples = false;

        // NOTE: The chart opens on the most recent date.
        selectDate(state, d3.max(state.dates) ?? new Date(), 0);
      }),

  actions: {
    toggleMultiples(state, _e, value) {
      state.isMultiples = value === SEPARATED;
    },

    // NOTE: The move behavior inverts the pointer position through both scales, so
    // it hands back a date anywhere in the domain; the data has one stack per
    // date, so the nearest one wins.
    changeDate(state, _e, xValue, yValue) {
      if (xValue instanceof Date && typeof yValue === "number") {
        selectDate(state, closestDate(state.dates, xValue), yValue);
      }
    },

    resetDate(state) {
      selectDate(state, d3.max(state.dates) ?? new Date(), 0);
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.timeExtent.map(props.xLabelFormat),
        legendLabels: state.categories,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds(
      { top: CONTROL_HEIGHT, bottom: legendLayout.bottomPadding },
      config.id,
    );

    const multiplesLayout = sszvis.layoutStackedAreaMultiples(
      bounds.innerHeight,
      state.stackedData.length,
      MULTIPLES_PAD_RATIO,
    );

    // Scales

    const xScale = d3.scaleTime().domain(state.timeExtent).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain([0, state.maxStacked]).range([bounds.innerHeight, 0]);

    // NOTE: In multiples mode each band has its own baseline and its own height, so
    // a band's top is its baseline minus the value scaled within the band.
    const yScaleMultiples = d3
      .scaleLinear()
      .domain([0, state.maxValue])
      .range([0, multiplesLayout.bandHeight]);

    const yPositionMultiples = d3
      .scaleOrdinal<string, number>()
      .domain(state.categories)
      .range(multiplesLayout.range);

    const bandTop = (d: BandPoint) =>
      yPositionMultiples(d.key) - yScaleMultiples(d.data.values[d.key]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Wohnbevölkerung nach Nationalität",
        description:
          "Ausländische und schweizerische Wohnbevölkerung der Stadt Zürich pro Jahr, summiert oder getrennt.",
      })
      .datum(state.stackedData);

    const htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    const stackedArea = sszvis
      .stackedArea<BandPoint, Band>()
      .key((band) => band.key)
      .x((d) => xScale(d.data.year))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .fill((band) => String(cScale(band.key)));

    const stackedAreaMultiples = sszvis
      .stackedAreaMultiples<BandPoint, Band>()
      .key((band) => band.key)
      .x((d) => xScale(d.data.year))
      .y0((d) => yPositionMultiples(d.key))
      .y1(bandTop)
      .fill((band) => String(cScale(band.key)));

    // NOTE: In multiples mode the ruler spans from the top of the topmost band;
    // summed, it spans from the top of the whole stack.
    const topPoint = state.highlightData.at(-1);
    const rulerTop =
      state.isMultiples && topPoint !== undefined
        ? bandTop(topPoint)
        : yScale(state.totalHighlightValue);

    /**
     * Whether the pointer is inside this band. Summed, the pointer's value is
     * compared against the band's own bounds; separated, its pixel position is
     * compared against the band's baseline and top.
     */
    const isUnderPointer = (d: BandPoint) => {
      if (!state.isMultiples) {
        return d[0] < state.mouseYValue && d[1] > state.mouseYValue;
      }
      const pointerY = yScale(state.mouseYValue);
      return yPositionMultiples(d.key) > pointerY && bandTop(d) < pointerY;
    };

    const isFlipped = () => xScale(state.highlightDate) >= 0.5 * bounds.innerWidth;

    const rangeRuler = sszvis
      .annotationRangeRuler<BandPoint>()
      .top(rulerTop)
      .bottom(bounds.innerHeight)
      .x(xScale(state.highlightDate))
      .y0((d) => (state.isMultiples ? yPositionMultiples(d.key) : yScale(d[0])))
      .y1((d) => (state.isMultiples ? bandTop(d) : yScale(d[1])))
      // NOTE: the ruler pipes this through formatNumber, so return the number itself.
      .label((d) => d.data.values[d.key])
      .total(state.totalHighlightValue)
      .flip(isFlipped);

    const tooltipText = sszvis
      .modularTextHTML()
      .bold((d: BandPoint) => sszvis.formatNumber(d.data.values[d.key]))
      .plain((d: BandPoint) => d.key);

    const rangeTooltip = sszvis
      .tooltip<BandPoint>()
      .header(tooltipText)
      .orientation(() => (isFlipped() ? "right" : "left"))
      .renderInto(htmlLayer)
      .visible(true);

    const rangeFlag = sszvis
      .annotationRangeFlag<BandPoint>()
      .x(xScale(state.highlightDate))
      .y0((d) => (state.isMultiples ? yPositionMultiples(d.key) : yScale(d[0])))
      .y1((d) => (state.isMultiples ? bandTop(d) : yScale(d[1])));

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      // NOTE: The highlighted date gets a tick of its own, on top of the regular ones.
      .tickValues([...xScale.ticks(X_TICKS), state.highlightDate])
      .tickFormat((d) => props.xLabelFormat(new Date(d.valueOf())))
      .highlightTick((d) => sszvis.stringEqual(d, state.highlightDate));

    const yAxis = sszvis.axisY().scale(yScale).contour(true).orient("right");

    const buttonGroup = sszvis
      .buttonGroup<string>()
      .values([SUMMED, SEPARATED])
      .current(state.isMultiples ? SEPARATED : SUMMED)
      .change(actions.toggleMultiples)
      .width(props.controlWidth);

    // Rendering

    chartLayer
      .selectGroup("areachart")
      .call(state.isMultiples ? stackedAreaMultiples : stackedArea);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    // NOTE: The y axis measures the summed stack, so it is faded out rather than
    // removed when the bands are separated and it no longer means anything.
    chartLayer
      .selectGroup("yAxis")
      .call(yAxis)
      .transition(sszvis.defaultTransition())
      .style("opacity", state.isMultiples ? 0 : 1);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(0, bounds.innerHeight + legendLayout.axisLabelPadding),
      )
      .call(colorLegend);

    htmlLayer
      .selectDiv("controls")
      .style("left", `${(bounds.innerWidth - buttonGroup.width()) / 2}px`)
      .style("top", `${CONTROL_TOP - bounds.padding.top}px`)
      .call(buttonGroup);

    chartLayer.selectGroup("highlight").datum(state.highlightData).call(rangeRuler);

    // NOTE: Only the band the pointer is inside gets a flag, and with it a tooltip.
    const flagGroup = chartLayer
      .selectGroup("flag")
      .datum(state.highlightData.filter(isUnderPointer))
      .call(rangeFlag);

    flagGroup.selectAll("[data-tooltip-anchor]").call(rangeTooltip);

    // Interaction

    const interactionLayer = sszvis
      .move<Date, number>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/**
 * Reshape the flat rows into one row per date, with a value per category, which is
 * the shape d3's stack layout consumes.
 */
const stackRows = (data: Datum[], categories: string[]): StackRow[] =>
  sszvis
    .cascade<Datum>()
    .arrayBy((d) => xAcc(d).getTime())
    .objectBy(cAcc)
    .apply<Record<string, Datum[]>[]>(data)
    .map((group) => ({
      year: xAcc(Object.values(group)[0][0]),
      values: Object.fromEntries(categories.map((c) => [c, yAcc(group[c][0])])),
    }));

/**
 * Run d3's stack layout and copy each band's category onto its points, because the
 * multiples components position every point by the category it belongs to.
 *
 * NOTE: The keys are reversed so that the first category ends up on top of the
 * stack rather than at its base.
 */
const stackBands = (rows: StackRow[], categories: string[]): Band[] =>
  d3
    .stack<StackRow, string>()
    .keys([...categories].reverse())
    .value((row, key) => row.values[key])(rows)
    .map((series) =>
      Object.assign(
        series.map((point) => ({
          0: point[0],
          1: point[1],
          data: point.data,
          key: series.key,
        })),
        { key: series.key },
      ),
    );

/**
 * Move the ruler to `date`: everything it draws is derived from the date and from
 * the pointer's height, so `init` and both actions go through here.
 */
const selectDate = (state: State, date: Date, mouseYValue: number): void => {
  state.highlightDate = date;
  state.highlightData = state.stackedData.flatMap((band) =>
    band.filter((point) => sszvis.stringEqual(point.data.year, date)),
  );
  state.totalHighlightValue = d3.sum(
    state.categories,
    (c) => state.highlightData[0]?.data.values[c] ?? 0,
  );
  state.mouseYValue = mouseYValue;
};

/** The date in `dates` - which is sorted ascending - nearest to `target`. */
const closestDate = (dates: Date[], target: Date): Date => {
  const i = d3.bisectLeft(dates, target, 1);
  const before = dates[i - 1];
  const after = dates[i] ?? before;
  return target.valueOf() - before.valueOf() > after.valueOf() - target.valueOf() ? after : before;
};
