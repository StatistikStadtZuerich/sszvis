/**
 * Line chart example with a circular annotation highlighting a single day.
 *
 * @sszvis   3.5.1
 * @chart    line-chart
 * @features annotation
 * @date     2026-09-14
 */

// Magic Numbers

// NOTE: The chart shows a single series, so the whole line takes one palette
// colour; this is the ordinal scale's only key.
const SERIES_KEY = "Regen";
/** Days singled out by the circle annotation, matched on the parsed date. */
const HIGHLIGHTED_DATES = [new Date(2013, 10, 10)];
/** Radius of the annotation circle in pixels. */
const ANNOTATION_RADIUS = 20;
/** Vertical offset of the annotation caption from the circle's centre, in pixels. */
const ANNOTATION_CAPTION_OFFSET = -30;

// Types

type Datum = {
  date: Date;
  value: number;
};

type State = {
  data: Datum[];
  dates: [Date, Date];
  lineData: Datum[][];
  annotatedData: Datum[];
};

// NOTE: The chart is not interactive, so it declares no actions; the type is
// still named, so that `app()` reports a mistyped dispatcher as an error.
type Actions = Record<string, never>;

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: "Datum" })
  .prop("yLabel", { _: "Regen" });

// Accessors

const xAcc = (d: Datum) => d.date;
const yAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => {
        const date = sszvis.parseDate(d["Datum"]);
        // NOTE: A row whose date cannot be parsed has no position on the time
        // axis; returning null from the row callback drops it from the data.
        return date === null ? null : { date, value: sszvis.parseNumber(d["Regen"]) };
      })
      .then((data) => {
        state.data = data;
        state.dates = [d3.min(data, xAcc) ?? new Date(), d3.max(data, xAcc) ?? new Date()];
        // NOTE: The line component draws an array of lines, and this chart has one.
        state.lineData = [data];
        state.annotatedData = data.filter((d) =>
          sszvis.contains(HIGHLIGHTED_DATES.map(String), String(xAcc(d))),
        );
      }),

  render(state) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds({ top: 30, bottom: 45 }, config.id);

    // Scales

    const xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(state.data, yAcc) ?? 0])
      .range([bounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Niederschlag in der Stadt Zürich",
        description: "Tägliche Regenmenge im November 2013.",
      })
      .datum(state.lineData);

    // Components

    const line = sszvis
      .line<Datum, Datum[]>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .stroke(String(sszvis.scaleQual12()(SERIES_KEY)));

    const xAxis = sszvis.axisX.time().scale(xScale).orient("bottom").title(props.xLabel);

    const yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .contour(true)
      .title(props.yLabel)
      .dyTitle(-20);

    const annotation = sszvis
      .annotationCircle<Datum>()
      .x((d) => xScale(xAcc(d)))
      .y((d) => yScale(yAcc(d)))
      .r(ANNOTATION_RADIUS)
      .dy(ANNOTATION_CAPTION_OFFSET)
      .caption((d) => `Referenzwert A (${yAcc(d)})`);

    // Rendering

    chartLayer.selectGroup("annotation").datum(state.annotatedData).call(annotation);

    chartLayer.selectGroup("line").call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);
  },
});
