/**
 * Scatterplot whose points trace a path over time, with a slider to move through the years.
 *
 * @sszvis   3.5.1
 * @chart    scatterplot-over-time
 * @features tooltip, slider, voronoi
 * @date     2026-09-14
 */

// Magic Numbers

/** Vertical space reserved below the chart for the slider control, in pixels. */
const SLIDER_CONTROL_HEIGHT = 60;
/** Distance from the bottom of the plot area to the slider's own top edge, in pixels. */
const SLIDER_OFFSET = 46;
/** Radius in pixels of a dot in the year the slider is on. */
const CURRENT_DOT_RADIUS = 4;
/** Radius in pixels of a dot in an earlier year, which is drawn only when selected. */
const PAST_DOT_RADIUS = 3;
const LINE_STROKE_WIDTH = 1.8;
/** White outlines help the eye separate dots that overlap. */
const DOT_STROKE = "#FFFFFF";
/** How far past the plot area the voronoi cells reach at the bottom, in pixels. */
const VORONOI_BOTTOM_OVERHANG = 20;

// Types

type Datum = {
  year: number;
  branch: string;
  count: number;
  percent: number;
};

type State = {
  data: Datum[];
  /** One array of points per branch, ordered by year. */
  linesData: Datum[][];
  /** Each branch's line up to and including the active year. */
  currentLinesData: Datum[][];
  /** Each branch's line from the active year onwards, drawn as a reference line. */
  futureLinesData: Datum[][];
  /** Only the active year's points; these are the visible dots. */
  currentData: Datum[];
  /** The active year and every earlier one, de-duplicated by position - see `setYear`. */
  voronoiPoints: Datum[];
  xExtent: [number, number];
  yExtent: [number, number];
  tExtent: [number, number];
  years: number[];
  branches: string[];
  activeYear: number;
  selection: Datum[];
};

type Actions = {
  setYear: (
    state: State,
    e: Event,
    year: number | string | Date | null,
    fraction: number | string | null,
  ) => void;
  selectPoint: (state: State, e: Event, datum?: Datum) => void;
  deselectPoint: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("xLabelFormat", { _: () => sszvis.formatNumber });

// Accessors

const xAcc = (d: Datum) => d.count;
const yAcc = (d: Datum) => d.percent;
const yearAcc = (d: Datum) => d.year;
const branchAcc = (d: Datum) => d.branch;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        year: sszvis.parseNumber(d["jahr"]),
        branch: d["brance"] ?? "",
        count: sszvis.parseNumber(d["beschaeftige"]),
        percent: sszvis.parseNumber(d["frauenanteil"]),
      }))
      .then((data) => {
        state.data = data;
        state.xExtent = [0, d3.max(data, xAcc) ?? 0];
        state.yExtent = [0, d3.max(data, yAcc) ?? 0];
        state.tExtent = [d3.min(data, yearAcc) ?? 0, d3.max(data, yearAcc) ?? 0];
        state.years = sszvis.set(data, yearAcc);
        state.branches = sszvis.set(data, branchAcc);
        state.linesData = sszvis
          .cascade<Datum>()
          .arrayBy(branchAcc, d3.ascending)
          .sort((a, b) => d3.ascending(yearAcc(a), yearAcc(b)))
          .apply<Datum[][]>(data);
        state.selection = [];
        // NOTE: The chart opens on the most recent year.
        selectYear(state, d3.max(state.years) ?? 0);
      }),

  actions: {
    // NOTE: The slider inverts the pointer position through its own scale, so it
    // hands back any number in the scale's domain; the data has one point per
    // year, so the nearest year wins.
    setYear(state, _e, year) {
      if (typeof year !== "number") {
        return;
      }
      selectYear(state, closestYear(state.years, year));
    },

    // NOTE: The voronoi behaviour types its datum as optional, because a touch
    // can end outside every cell; "over" always carries one.
    selectPoint(state, _e, datum) {
      state.selection = datum === undefined ? [] : [datum];
    },

    deselectPoint(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.xExtent.map(props.xLabelFormat),
        legendLabels: state.branches,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds(
      {
        top: 10,
        right: 5,
        bottom: SLIDER_CONTROL_HEIGHT + legendLayout.bottomPadding,
        left: 5,
      },
      config.id,
    );

    // Scales

    const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

    const tScale = d3.scaleLinear().domain(state.tExtent).range([0, bounds.innerWidth]);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Beschäftigte und Frauenanteil nach Branche",
      description:
        "Streudiagramm der Branchen; die Linien zeigen den Verlauf bis zum gewählten Jahr.",
    });

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    const lines = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .stroke((line) => String(cScale(branchAcc(line[0]))))
      .strokeWidth(LINE_STROKE_WIDTH)
      .transition(false);

    const futureLines = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .strokeWidth(LINE_STROKE_WIDTH)
      .transition(false);

    const visibleDots = sszvis
      .dot<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .radius(CURRENT_DOT_RADIUS)
      .fill((d) => String(cScale(branchAcc(d))))
      .stroke(DOT_STROKE)
      .transition(false);

    // NOTE: These dots cover the earlier years too. They carry the tooltip
    // anchors, so they are always rendered, but only the selected one has a
    // radius at all.
    const invisibleDots = sszvis
      .dot<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .radius((d) => (isSelected(state)(d) ? PAST_DOT_RADIUS : 0))
      .fill((d) => String(cScale(branchAcc(d))))
      .stroke(DOT_STROKE)
      .transition(false);

    const slider = sszvis
      .slider()
      .scale(tScale)
      .value(state.activeYear)
      .majorTicks(state.years)
      // NOTE: The ticks already name the years, so the handle needs no label.
      .label("")
      .onchange(actions.setYear);

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .ticks(4)
      .tickFormat((d) => props.xLabelFormat(Number(d)))
      .orient("bottom")
      .alignOuterLabels(true);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .ticks(6)
      .orient("right")
      // NOTE: showZeroY is itself implemented through tickFormat, so hiding the
      // zero label has to happen here rather than through that property.
      .tickFormat((d) => (Number(d) === 0 ? null : sszvis.formatPercent(Number(d))))
      .contour(true);

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible(isSelected(state))
      .header(sszvis.modularTextHTML().bold((d: Datum) => branchAcc(d)))
      .body((d) => [
        ["Jahr", sszvis.formatText(yearAcc(d))],
        ["Beschäftige", sszvis.formatNumber(xAcc(d))],
        ["Frauenanteil", sszvis.formatPercent(yAcc(d))],
      ]);

    // Rendering

    // NOTE: The line layers are bound to arrays of points, one per branch, not to
    // the flat data the dot layers use.
    chartLayer.selectGroup("lines").datum(state.currentLinesData).call(lines);

    chartLayer
      .selectGroup("futureLines")
      .datum(state.futureLinesData)
      .call(futureLines)
      .selectAll(".sszvis-line")
      // NOTE: Styling the future as a reference line is a CSS class, not a
      // separate component.
      .classed("sszvis-referenceline", true);

    chartLayer
      .selectGroup("invisibleDots")
      .datum(state.voronoiPoints)
      .call(invisibleDots)
      .selectAll("[data-tooltip-anchor]")
      .call(tooltip);

    chartLayer.selectGroup("visibleDots").datum(state.currentData).call(visibleDots);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("slider")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + SLIDER_OFFSET))
      .call(slider);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(
          0,
          bounds.innerHeight + SLIDER_CONTROL_HEIGHT + legendLayout.axisLabelPadding,
        ),
      )
      .call(colorLegend);

    // Interaction

    const mouseOverlay = sszvis
      .voronoi<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .bounds([
        -bounds.padding.left,
        -bounds.padding.top,
        bounds.innerWidth + bounds.padding.right,
        bounds.innerHeight + VORONOI_BOTTOM_OVERHANG,
      ])
      .on("over", actions.selectPoint)
      .on("out", actions.deselectPoint);

    chartLayer.selectGroup("voronoiInteraction").datum(state.voronoiPoints).call(mouseOverlay);
  },
});

// Helper functions

/**
 * Move the chart to `year`: everything drawn is derived from it, so `init` and the
 * slider both go through here rather than duplicating the derivation.
 */
const selectYear = (state: State, year: number): void => {
  state.activeYear = year;

  state.currentLinesData = state.linesData.map((line) => line.filter((d) => yearAcc(d) <= year));
  state.futureLinesData = state.linesData.map((line) => line.filter((d) => yearAcc(d) >= year));
  state.currentData = state.data.filter((d) => yearAcc(d) === year);

  // NOTE: The voronoi layer covers the active year and every earlier one, and it
  // requires that no two input vertices lie at exactly the same point, so points
  // that coincide are dropped.
  const currentAndPast = state.data.filter((d) => yearAcc(d) <= year);
  state.voronoiPoints = sszvis.derivedSet(currentAndPast, (d) => `${xAcc(d)}__${yAcc(d)}`);

  if (currentAndPast.length !== state.voronoiPoints.length) {
    console.warn(
      `${currentAndPast.length - state.voronoiPoints.length} data points were filtered out of the voronoi points because the voronoi interaction layer requires that no two input vertices lie at the same point.`,
    );
  }
};

/** The year in `years` - which is sorted ascending - nearest to `target`. */
const closestYear = (years: number[], target: number): number => {
  const i = d3.bisectLeft(years, target, 1);
  const before = years[i - 1];
  const after = years[i] ?? before;
  return target - before > after - target ? after : before;
};

const isSelected = (state: State) => (d: Datum) => sszvis.contains(state.selection, d);
