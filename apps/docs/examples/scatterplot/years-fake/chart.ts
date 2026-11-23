/**
 * Scatterplot of one quarter at a time, with a slider to move through the quarters.
 *
 * @sszvis   3.5.1
 * @chart    scatterplot
 * @features legend, slider
 * @date     2026-09-14
 */

// Magic Numbers

/** Vertical space reserved below the chart for the slider control, in pixels. */
const SLIDER_CONTROL_HEIGHT = 60;
/** Distance from the bottom of the plot area to the slider's own top edge, in pixels. */
const SLIDER_OFFSET = 46;
/** Radius of a single dot, in pixels. */
const DOT_RADIUS = 4;
/** White outlines help the eye separate dots that overlap. */
const DOT_STROKE = "#FFFFFF";

// Types

type Datum = {
  xValue: number;
  yValue: number;
  city: string;
  location: string;
  quarter: Date;
};

type State = {
  data: Datum[];
  xExtent: [number, number];
  yMax: number;
  tExtent: [Date, Date];
  cities: string[];
  quarters: Date[];
  activeQuarter: Date;
};

type Actions = {
  setQuarter: (
    state: State,
    e: Event,
    quarter: number | string | Date | null,
    fraction: number | string | null,
  ) => void;
};

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("xLabelFormat", { _: () => sszvis.formatNumber });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const yAcc = (d: Datum) => d.yValue;
const cAcc = (d: Datum) => d.city;
const qAcc = (d: Datum) => d.quarter;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      // NOTE: A row whose date cannot be parsed is skipped - returning null from a
      // d3 row callback drops the row - because the slider steps through quarters
      // and a row with no quarter belongs to none of them.
      .csv(config.data, (d) => {
        const quarter = sszvis.parseDate(d["Quarter"]);
        return quarter === null
          ? null
          : {
              xValue: sszvis.parseNumber(d["XValue"]),
              yValue: sszvis.parseNumber(d["YValue"]),
              city: d["City"] ?? "",
              location: d["Location"] ?? "",
              quarter,
            };
      })
      .then((data) => {
        const quarters = sszvis.set(data, qAcc);
        state.data = data;
        state.xExtent = [d3.min(data, xAcc) ?? 0, d3.max(data, xAcc) ?? 0];
        state.yMax = d3.max(data, yAcc) ?? 0;
        state.tExtent = [d3.min(data, qAcc) ?? new Date(), d3.max(data, qAcc) ?? new Date()];
        state.cities = sszvis.set(data, cAcc);
        state.quarters = quarters;
        // NOTE: The chart opens on the most recent quarter.
        state.activeQuarter = d3.max(quarters) ?? new Date();
      }),

  actions: {
    // NOTE: The slider inverts the pointer position through its own time scale,
    // so it hands back a Date anywhere in the scale's domain; the chart only
    // draws quarters, so the nearest one wins.
    setQuarter(state, _e, quarter) {
      if (quarter instanceof Date) {
        state.activeQuarter = closestQuarter(state.quarters, quarter);
      }
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    const legendLayout = sszvis.colorLegendLayout(
      {
        axisLabels: state.xExtent.map(props.xLabelFormat),
        legendLabels: state.cities,
      },
      config.id,
    );

    const cScale = legendLayout.scale;
    const colorLegend = legendLayout.legend;

    const bounds = sszvis.bounds(
      { top: 20, bottom: SLIDER_CONTROL_HEIGHT + legendLayout.bottomPadding },
      config.id,
    );

    // Scales

    const xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain([0, state.yMax]).range([bounds.innerHeight, 0]);

    const tScale = d3.scaleTime().domain(state.tExtent).range([0, bounds.innerWidth]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Kennzahlen nach Stadt und Quartal",
        description: "Streudiagramm der Standorte des gewählten Quartals, nach Stadt eingefärbt.",
      })
      .datum(state.data.filter((d) => sszvis.stringEqual(qAcc(d), state.activeQuarter)));

    // Components

    const dots = sszvis
      .dot<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .radius(DOT_RADIUS)
      .fill((d) => String(cScale(cAcc(d))))
      .stroke(DOT_STROKE);

    const slider = sszvis
      .slider()
      .scale(tScale)
      .value(state.activeQuarter)
      .minorTicks(state.quarters)
      // NOTE: derivedSet, not set: one major tick per year, keyed by the year of
      // the quarter it stands for.
      .majorTicks(sszvis.derivedSet(state.quarters, (d) => d.getFullYear()))
      .tickLabels((d) => sszvis.formatAxisTimeFormat(new Date(d.valueOf())))
      .label((d) => sszvis.formatMonth(new Date(d.valueOf())))
      .onchange(actions.setQuarter);

    const xAxis = sszvis
      .axisX()
      .scale(xScale)
      .tickFormat((d) => props.xLabelFormat(Number(d)))
      .orient("bottom");

    const yAxis = sszvis.axisY().scale(yScale).orient("right").contour(true);

    // Rendering

    chartLayer.selectGroup("dots").call(dots);

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
  },
});

// Helper functions

/** The quarter in `quarters` - which is sorted ascending - nearest to `target`. */
const closestQuarter = (quarters: Date[], target: Date): Date => {
  const i = d3.bisectLeft(quarters, target, 1);
  const before = quarters[i - 1];
  const after = quarters[i] ?? before;
  return target.valueOf() - before.valueOf() > after.valueOf() - target.valueOf() ? after : before;
};
