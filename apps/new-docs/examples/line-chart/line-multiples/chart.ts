/**
 * Small multiples line chart, one panel per Stadtkreis.
 *
 * @category line-chart
 */

// Magic Numbers

/** Gap in pixels between neighbouring panels, horizontally and vertically. */
const PANEL_PADDING = 30;
const TOP_PADDING = 20;
/** Vertical space in pixels the colour legend needs below the panels. */
const LEGEND_HEIGHT = 80;
const BOTTOM_PADDING = 40 + LEGEND_HEIGHT;
/** The measure is a percentage, so every panel's y axis spans the full 0-100 range. */
const Y_MAX = 100;
/** Vertical gap in pixels between the bottom row of panels and the legend. */
const PANELS_LEGEND_GAP = 60;

// Types

type Datum = {
  year: number;
  value: number;
  category: string;
  kreisNum: number;
};

/** One panel of the grid. `values` is the shape `layoutSmallMultiples` requires. */
type LineGroup = {
  values: Datum[];
  category: string;
  kreisNum: number;
  gw?: number;
  gh?: number;
};

/** How the panels are arranged at one breakpoint. */
type Layout = {
  rows: number;
  cols: number;
  /** Height in pixels of a single panel. */
  panelHeight: number;
  sidePadding: number;
};

type State = {
  data: Datum[];
  lineGroups: LineGroup[];
  categories: string[];
  years: [number, number];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, year: number | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("layout", {
    palm: { rows: 6, cols: 2, panelHeight: 140, sidePadding: 10 },
    lap: { rows: 4, cols: 3, panelHeight: 160, sidePadding: 20 },
    _: { rows: 3, cols: 4, panelHeight: 180, sidePadding: 20 },
  })
  .prop("colorLegendColumns", { palm: 2, lap: 3, _: 4 })
  .prop("colorLegendColumnWidth", {
    palm: (width: number) => width / 2,
    lap: (width: number) => width / 3,
    _: (width: number) => width / 4,
  });

// Accessors

const xAcc = (d: Datum) => d.year;
const yAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) =>
        // NOTE: The file also carries Quartier rows; returning null drops them
        // before they ever reach the state.
        d["Raum"] === "Stadtkreis"
          ? {
              year: sszvis.parseNumber(d["Jahr"]),
              value: sszvis.parseNumber(d["Wert"]),
              category: d["Kreis"] ?? "",
              kreisNum: sszvis.parseNumber(d["KreisNum"]),
            }
          : null,
      )
      .then((rows) => {
        const data = [...rows];
        const groups: Datum[][] = sszvis
          .cascade<Datum>()
          .arrayBy(cAcc, d3.ascending)
          .apply<Datum[][]>(data);

        state.data = data;
        // NOTE: Panels read left to right in Kreis order, which is not the order
        // the cascade produces.
        state.lineGroups = groups
          .map((points) => toLineGroup(points))
          .sort((a, b) => a.kreisNum - b.kreisNum);
        state.categories = state.lineGroups.map((group) => group.category);
        state.years = [d3.min(data, xAcc) ?? 0, d3.max(data, xAcc) ?? 0];
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, year) {
      state.selection = selectionAtYear(state, year);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const layout: Layout = props.layout;
    const bounds = sszvis.bounds(
      {
        top: TOP_PADDING,
        right: layout.sidePadding,
        bottom: BOTTOM_PADDING,
        left: layout.sidePadding,
        height:
          TOP_PADDING +
          layout.rows * layout.panelHeight +
          (layout.rows - 1) * PANEL_PADDING +
          BOTTOM_PADDING,
      },
      config.id,
    );

    // Scales

    // NOTE: These two are templates; every panel copies them and gives the copy
    // its own pixel range, which is only known once the layout has run. The
    // ranges set here are only ever used by the move behavior below.
    const xScale = d3.scaleLinear().domain(state.years).range([0, Y_MAX]);
    const yScale = d3.scaleLinear().domain([0, Y_MAX]).range([Y_MAX, 0]);
    const cScale = sszvis.scaleQual12().domain(state.categories);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Antwortquote nach Stadtkreis",
        description: "Antwortquote der Bevölkerungsbefragung je Stadtkreis, in Prozent.",
      })
      .datum(state.lineGroups);

    // Components

    const multiplesMaker = sszvis
      .layoutSmallMultiples<LineGroup>()
      .width(bounds.innerWidth)
      .height(bounds.innerHeight - PANELS_LEGEND_GAP)
      .paddingX(PANEL_PADDING)
      .paddingY(PANEL_PADDING)
      .rows(layout.rows)
      .cols(layout.cols)
      .showTitle(true)
      .titleLabel((d) => d.category)
      .titleAnchor("start")
      .titleY(-10);

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .columnWidth(props.colorLegendColumnWidth)
      .columns(props.colorLegendColumns)
      .orientation("horizontal");

    // Rendering

    const panels = chartLayer.selectGroup("panels").call(multiplesMaker);

    panels.selectAll(".sszvis-multiple").each(function (this: SVGGElement, group: LineGroup) {
      const panelWidth = group.gw ?? 0;
      const panelHeight = group.gh ?? 0;
      const panelSelection = d3.select(this);
      const chart = panelSelection.selectAll<SVGGElement, unknown>(".sszvis-multiple-chart");

      const panelXScale = xScale.copy().range([0, panelWidth]);
      const panelYScale = yScale.copy().range([panelHeight, 0]);

      const line = sszvis
        .line<Datum, Datum[]>()
        .x((d) => panelXScale(xAcc(d)))
        .y((d) => panelYScale(yAcc(d)))
        .stroke(String(cScale(group.category)));

      chart.datum([group.values]).call(line);

      // NOTE: Only the outer edge of the grid carries axes, so the panels stay
      // readable at small sizes.
      const index = state.lineGroups.indexOf(group);
      const isBottomRow = Math.floor(index / layout.cols) === layout.rows - 1;
      const isLeftColumn = index % layout.cols === 0;

      if (isBottomRow) {
        const xAxis = sszvis
          .axisX()
          .scale(panelXScale)
          .orient("bottom")
          .tickFormat((d) => d3.format("d")(Number(d)))
          .ticks(4);

        chart
          .selectAll(".sszvis-axis--x")
          .data([null])
          .join("g")
          .classed("sszvis-axis sszvis-axis--x", true)
          .attr("transform", sszvis.translateString(0, panelHeight))
          .call(xAxis);
      }

      if (isLeftColumn) {
        const yAxis = sszvis
          .axisY()
          .scale(panelYScale)
          .orient("right")
          .ticks(3)
          .tickFormat((d) => `${d}%`)
          .contour(true);

        chart
          .selectAll(".sszvis-axis--y")
          .data([null])
          .join("g")
          .classed("sszvis-axis sszvis-axis--y", true)
          .call(yAxis);
      }

      const highlighted = state.selection.find((d) => cAcc(d) === group.category);

      if (highlighted === undefined) {
        chart.selectAll(".sszvis-ruler").remove();
        return;
      }

      const ruler = sszvis
        .annotationRuler<Datum>()
        .top(0)
        .bottom(panelHeight)
        .x((d) => panelXScale(xAcc(d)))
        .y((d) => panelYScale(yAcc(d)))
        .label(sszvis.modularTextSVG().bold((d: Datum) => sszvis.formatPercent(yAcc(d) / Y_MAX)))
        .flip((d) => panelXScale(xAcc(d)) >= panelWidth / 2)
        .color(String(cScale(group.category)));

      chart
        .selectAll(".sszvis-ruler")
        .data([highlighted])
        .join("g")
        .classed("sszvis-ruler", true)
        .call(ruler);
    });

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight - 40))
      .call(colorLegend);

    // Interaction

    // NOTE: The scales here are the unranged templates, so the inverted position
    // is read against the whole grid rather than against one panel.
    const interactionLayer = sszvis
      .move<number, number>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    panels.call(interactionLayer);
  },
});

// Helper functions

/** Wraps one cascade group in the shape `layoutSmallMultiples` binds to a panel. */
const toLineGroup = (points: Datum[]): LineGroup => {
  const first = points[0];
  return {
    values: [...points].sort((a, b) => xAcc(a) - xAcc(b)),
    category: first ? cAcc(first) : "",
    kreisNum: first ? first.kreisNum : 0,
  };
};

/**
 * The pointer position is a continuous year, so each panel contributes the point
 * nearest to it. Panels with no value at that year drop out of the selection.
 */
const selectionAtYear = (state: State, year: number | null): Datum[] => {
  if (year == null) {
    return [];
  }
  const nearestYear = xAcc(closestDatum(state.data, year));
  return state.lineGroups
    .map((group) => sszvis.find((d) => xAcc(d) === nearestYear, group.values))
    .filter((d): d is Datum => d !== undefined && !Number.isNaN(yAcc(d)));
};

/** Binary search for the datum whose year lies closest to `year`. */
const closestDatum = (data: Datum[], year: number): Datum => {
  const i = d3.bisector(xAcc).left(data, year, 1);
  const d0 = data[i - 1];
  const d1 = data[i] ?? d0;
  if (!d0 || !d1) {
    throw new Error("closestDatum: no data");
  }
  return year - xAcc(d0) > xAcc(d1) - year ? d1 : d0;
};
