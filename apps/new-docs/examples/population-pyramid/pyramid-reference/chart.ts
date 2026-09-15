/**
 * Population pyramid with a reference outline drawn over the bars.
 *
 * @category population-pyramid
 */

// Magic Numbers

/**
 * The pyramid is laid out 2px narrower than the container so that the outermost
 * bars are not clipped by the edge of the SVG.
 */
const PYRAMID_INSET = 2;
const CHART_PADDING = { top: 25, bottom: 86 };
/** Vertical gap in pixels between the bottom of the chart area and the colour legend. */
const LEGEND_OFFSET = 60;
/** The series drawn as bars; the other education group is drawn as the reference line. */
const SERIES_KEY = "Hochschulabschluss";
const REFERENCE_KEY = "Andere";

// Types

type Datum = {
  age: number;
  gender: string;
  group: string;
  value: number;
};

/** The rows grouped by education group and then by gender, as the pyramid reads them. */
type Populations = Record<string, Record<string, Datum[]>>;

type State = {
  data: Datum[];
  ages: number[];
  maxValue: number;
  populations: Populations;
};

type Actions = Record<string, never>;

// Accessors

const vAcc = (d: Datum) => d.value;
const gAcc = (d: Datum) => d.gender;
const aAcc = (d: Datum) => d.age;
const groupAcc = (d: Datum) => d.group;

const side = (group: string, gender: string) => (p: Populations) => p[group]?.[gender] ?? [];

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        age: sszvis.parseNumber(d["Alter"]),
        gender: d["Geschlecht"] ?? "",
        group: d["Ausbildung"] ?? "",
        value: sszvis.parseNumber(d["Anzahl"]),
      }))
      .then((data) => {
        state.data = data;
        // The pyramid has one bar per year of age, from newborns to centenarians.
        state.ages = d3.range(0, 101);
        state.maxValue = d3.max(data, vAcc) ?? 0;
        state.populations = sszvis
          .cascade<Datum>()
          .objectBy(groupAcc)
          .objectBy(gAcc)
          .apply<Populations>(data);
      }),

  render(state) {
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

    // Scales

    const lengthScale = d3
      .scaleLinear()
      .domain([0, state.maxValue])
      .range([0, pyramidDimensions.maxBarLength]);

    const positionScale = d3
      .scaleOrdinal<number, number>()
      .domain(state.ages)
      .range(pyramidDimensions.positions);

    const colorScale = sszvis.scaleGender3();

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Bevölkerung der Stadt Zürich nach Alter, Geschlecht und Ausbildung",
        description:
          "Anzahl Frauen und Männer mit Hochschulabschluss, mit der übrigen Bevölkerung als Referenzlinie.",
      })
      .datum(state.populations);

    // Components

    const pyramid = sszvis
      .pyramid<Populations, Datum>()
      .barFill((d) => String(colorScale(gAcc(d))))
      .barPosition((d) => positionScale(aAcc(d)))
      .barHeight(pyramidDimensions.barHeight)
      .barWidth((d) => lengthScale(vAcc(d)))
      .leftAccessor(side(SERIES_KEY, "Frauen"))
      .rightAccessor(side(SERIES_KEY, "Männer"))
      .leftRefAccessor(side(REFERENCE_KEY, "Frauen"))
      .rightRefAccessor(side(REFERENCE_KEY, "Männer"));

    const xAxis = sszvis.axisX
      .pyramid()
      .scale(lengthScale)
      .orient("bottom")
      .ticks(5)
      .title("Anzahl Frauen und Männer mit Hochschulabschluss")
      .titleAnchor("middle")
      .titleCenter(true);

    const yAxis = sszvis.axisY
      .ordinal()
      .scale(positionScale)
      .orient("right")
      // NOTE: The bar for age 0 sits on the axis line, so its label is left out.
      .tickFormat((d) => (Number(d) === 0 ? "" : sszvis.formatAge(Number(d))))
      .ticks(5)
      .title("Alter in Jahren")
      .dyTitle(-18);

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(colorScale)
      .reverse(true)
      .horizontalFloat(true);

    // Rendering

    chartLayer
      .selectGroup("populationPyramid")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2, 0))
      .call(pyramid);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight + LEGEND_OFFSET))
      .call(colorLegend);
  },
});
