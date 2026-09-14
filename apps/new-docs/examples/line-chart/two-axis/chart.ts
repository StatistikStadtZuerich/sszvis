/**
 * Line chart example with two independent y axes, one on each side.
 *
 * @category line-chart
 */

// Magic Numbers

/**
 * The values of "Region" that belong on the right-hand axis. Everything else is
 * measured against the left-hand axis.
 */
const AXIS2_REGIONS = new Set(["Schweiz"]);
/**
 * Headroom factor on the left axis. Stretching its domain past the data keeps
 * the regional lines clear of the national line drawn on the other axis.
 */
const AXIS1_HEADROOM = 1.2;
/** Vertical offset in pixels from the x axis down to the two colour legends. */
const LEGEND_OFFSET = 60;

// Types

type Datum = {
  date: Date;
  region: string;
  value: number;
};

type State = {
  data: Datum[];
  dates: [Date, Date];
  lineData: Datum[][];
  axis1maxY: number;
  axis2maxY: number;
  categories1: string[];
  categories2: string[];
  selection: Datum[];
};

type Actions = {
  changeDate: (state: State, e: Event, date: Date | null) => void;
  resetDate: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("yAxis2Label", {
  palm: "(schweizweit)",
  _: "Anzahl Arbeitslose (schweizweit)",
});

// Accessors

const xAcc = (d: Datum) => d.date;
const yAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.region;

/** Whether a datum is measured against the right-hand axis rather than the left. */
const isOnAxis2 = (d: Datum) => AXIS2_REGIONS.has(cAcc(d));

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => {
        // NOTE: `parseDate` returns null for a cell it cannot read; returning null
        // from the row callback drops that row rather than plotting a broken point.
        const date = sszvis.parseDate(d["Jahr"] ?? "");
        return date === null
          ? null
          : {
              date,
              region: d["Region"] ?? "",
              value: sszvis.parseNumber(d["Schweiz"] ?? ""),
            };
      })
      .then((rows) => {
        const data = [...rows];
        const axis1Data = data.filter((d) => !isOnAxis2(d));
        const axis2Data = data.filter(isOnAxis2);

        state.data = data;
        state.dates = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        state.lineData = sszvis.cascade<Datum>().arrayBy(cAcc, d3.ascending).apply<Datum[][]>(data);

        state.axis1maxY = (d3.max(axis1Data, yAcc) ?? 0) * AXIS1_HEADROOM;
        state.axis2maxY = d3.max(axis2Data, yAcc) ?? 0;

        // NOTE: Two sets of categories, because each axis gets its own colour scale.
        state.categories1 = sszvis.set(axis1Data, cAcc);
        state.categories2 = sszvis.set(axis2Data, cAcc);

        state.selection = [];
      }),

  actions: {
    changeDate(state, _e, date) {
      state.selection = selectionAtDate(state, date);
    },

    resetDate(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds({ top: 30, bottom: 130 }, config.id);

    // Scales

    const xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

    const yScale1 = d3.scaleLinear().domain([0, state.axis1maxY]).range([bounds.innerHeight, 0]);
    const yScale2 = d3.scaleLinear().domain([0, state.axis2maxY]).range([bounds.innerHeight, 0]);

    const cScale1 = sszvis.scaleQual6a();
    const cScale2 = sszvis.scaleQual6b();

    /** Each datum is positioned against the axis its region belongs to. */
    const yPos = (d: Datum) => (isOnAxis2(d) ? yScale2(yAcc(d)) : yScale1(yAcc(d)));
    const colorOf = (d: Datum) => (isOnAxis2(d) ? cScale2(cAcc(d)) : cScale1(cAcc(d)));

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Arbeitslose regional und schweizweit",
        description: "Anzahl Arbeitslose pro Quartal, regional und schweizweit.",
      })
      .datum(state.lineData);

    // Components

    const line = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y(yPos)
      // NOTE: The stroke accessor is handed the whole line, so the colour comes
      // from its first point.
      .stroke((points) => {
        const first = points[0];
        return first ? String(colorOf(first)) : "";
      });

    const rulerLabel = sszvis
      .modularTextSVG()
      .bold((d: Datum) => sszvis.formatNumber(yAcc(d)))
      .plain((d: Datum) => cAcc(d));

    const ruler = sszvis
      .annotationRuler<Datum>()
      .top(0)
      .bottom(bounds.innerHeight)
      .label(rulerLabel)
      .x((d) => xScale(xAcc(d)))
      .y(yPos)
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color(colorOf);

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues([...xScale.ticks(5), ...state.selection.map(xAcc)])
      .alignOuterLabels(true)
      .highlightTick(isSelectedDate(state))
      .title("Quartal")
      .titleCenter(true)
      .titleAnchor("middle");

    const yAxis1 = sszvis
      .axisY()
      .scale(yScale1)
      .orient("right")
      .contour(true)
      .title("Anzahl Arbeitslose (regional)")
      .dyTitle(-20);

    const yAxis2 = sszvis
      .axisY()
      .scale(yScale2)
      .orient("left")
      .contour(true)
      .title(props.yAxis2Label)
      .dyTitle(-20);

    const cLegend1 = sszvis.legendColorOrdinal().scale(cScale1).orientation("vertical");

    const cLegend2 = sszvis
      .legendColorOrdinal()
      .scale(cScale2)
      .orientation("vertical")
      .rightAlign(true);

    // Rendering

    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis1").call(yAxis1);

    chartLayer
      .selectGroup("yAxis2")
      .attr("transform", sszvis.translateString(bounds.innerWidth, 0))
      .call(yAxis2);

    chartLayer
      .selectGroup("cScale1")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + LEGEND_OFFSET))
      .call(cLegend1);

    chartLayer
      .selectGroup("cScale2")
      .attr(
        "transform",
        sszvis.translateString(bounds.innerWidth, bounds.innerHeight + LEGEND_OFFSET),
      )
      .call(cLegend2);

    chartLayer.selectGroup("rulerLayer").datum(state.selection).call(ruler);

    // Interaction

    // NOTE: Only the x position is read, so either y scale would do here.
    const interactionLayer = sszvis
      .move<Date, number>()
      .xScale(xScale)
      .yScale(yScale1)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/**
 * The pointer position is a continuous date, so each line contributes the point
 * nearest to it. Lines with no value at that date drop out of the selection.
 */
const selectionAtDate = (state: State, date: Date | null): Datum[] => {
  if (date == null) {
    return [];
  }
  const nearest = xAcc(closestDatum(state.data, date)).getTime();
  return state.lineData
    .map((points) => sszvis.find((d) => xAcc(d).getTime() === nearest, points))
    .filter((d): d is Datum => d !== undefined && !Number.isNaN(yAcc(d)));
};

/** Binary search for the datum whose date lies closest to `date`. */
const closestDatum = (data: Datum[], date: Date): Datum => {
  const i = d3.bisector(xAcc).left(data, date, 1);
  const d0 = data[i - 1];
  const d1 = data[i] ?? d0;
  if (!d0 || !d1) {
    throw new Error("closestDatum: no data");
  }
  const target = date.getTime();
  return target - xAcc(d0).getTime() > xAcc(d1).getTime() - target ? d1 : d0;
};

/** Whether an x axis tick sits on one of the dates the ruler is currently showing. */
const isSelectedDate = (state: State) => (tick: unknown) =>
  state.selection.map((d) => String(xAcc(d))).includes(String(tick));
