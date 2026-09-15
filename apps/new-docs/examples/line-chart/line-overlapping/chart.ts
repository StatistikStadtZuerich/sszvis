/**
 * Line chart example drawing one overlapping line per Stadtkreis.
 *
 * @category line-chart
 */

// Magic Numbers

/** The measure is a percentage, so the y axis is pinned to the full 0-100 range. */
const Y_MAX = 100;
/** Vertical space in pixels reserved below the chart for the colour legend. */
const LEGEND_SPACE = 100;
const LEGEND_OFFSET = 40;

// Types

type Datum = {
  year: number;
  value: number;
  category: string;
  kreisNum: number;
};

type State = {
  data: Datum[];
  lineData: Datum[][];
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
  .prop("colorLegendColumns", { palm: 2, lap: 3, _: 6 })
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
      .then((data) => {
        const lines: Datum[][] = sszvis
          .cascade<Datum>()
          .arrayBy(cAcc, d3.ascending)
          .apply<Datum[][]>([...data]);

        state.data = [...data];
        state.lineData = lines
          .map((points) => [...points].sort((a, b) => xAcc(a) - xAcc(b)))
          .sort((a, b) => kreisNumOf(a) - kreisNumOf(b));
        state.categories = state.lineData.map((points) => (points[0] ? cAcc(points[0]) : ""));
        state.years = [d3.min(state.data, xAcc) ?? 0, d3.max(state.data, xAcc) ?? 0];
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, year) {
      state.selection = selectionAtYear(state, year);
    },

    // NOTE: With no pointer on the chart the ruler falls back to the most recent
    // year, so the chart always labels its own end point.
    hideTooltip(state) {
      state.selection = selectionAtYear(state, d3.max(state.data, xAcc) ?? null);
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds({ top: 30, bottom: LEGEND_SPACE }, config.id);

    // Scales

    const xScale = d3.scaleLinear().domain(state.years).range([0, bounds.innerWidth]);
    const yScale = d3.scaleLinear().domain([0, Y_MAX]).range([bounds.innerHeight, 0]);
    const cScale = sszvis.scaleQual12().domain(state.categories);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Antwortquote nach Stadtkreis",
        description: "Antwortquote der Bevölkerungsbefragung je Stadtkreis, in Prozent.",
      })
      .datum(state.lineData);

    // Components

    const line = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      // NOTE: The stroke accessor is handed the whole line, so the colour comes
      // from its first point.
      .stroke((points) => {
        const first = points[0];
        return first ? String(cScale(cAcc(first))) : "";
      });

    const rulerLabel = sszvis
      .modularTextSVG()
      .bold((d: Datum) => sszvis.formatPercent(yAcc(d) / Y_MAX))
      .plain((d: Datum) => cAcc(d));

    const ruler = sszvis
      .annotationRuler<Datum>()
      .top(0)
      .bottom(bounds.innerHeight)
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .label(rulerLabel)
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color((d) => cScale(cAcc(d)));

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .tickFormat((d) => d3.format("d")(Number(d)))
      .ticks(5)
      .highlightTick(isSelectedYear(state))
      .alignOuterLabels(true);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .ticks(5)
      .tickFormat((d) => `${d}%`)
      .contour(true)
      .title("Antwortquote")
      .dyTitle(-20);

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .columnWidth(props.colorLegendColumnWidth)
      .columns(props.colorLegendColumns)
      .orientation("horizontal");

    // Rendering

    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + LEGEND_OFFSET))
      .call(colorLegend);

    chartLayer.selectGroup("highlight").datum(state.selection).call(ruler);

    // Interaction

    const interactionLayer = sszvis
      .move<number, number>()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/** The Kreis number of a line, used to order the lines the way the legend reads. */
const kreisNumOf = (points: Datum[]) => (points[0] ? points[0].kreisNum : 0);

/**
 * The pointer position is a continuous year, so each line contributes the point
 * nearest to it. Lines with no value at that year drop out of the selection.
 */
const selectionAtYear = (state: State, year: number | null): Datum[] => {
  if (year == null) {
    return [];
  }
  const nearestYear = xAcc(closestDatum(state.data, year));
  return state.lineData
    .map((points) => sszvis.find((d) => xAcc(d) === nearestYear, points))
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

/** Whether an x axis tick sits on the year the ruler is currently showing. */
const isSelectedYear = (state: State) => (tick: unknown) => {
  const shown = state.selection[0];
  return shown !== undefined && String(tick) === String(xAcc(shown));
};
