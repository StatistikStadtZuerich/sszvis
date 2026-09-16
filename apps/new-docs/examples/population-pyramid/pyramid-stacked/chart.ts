/**
 * Population pyramid whose bars are stacked by level of education.
 *
 * @sszvis   3.5.1
 * @chart    population-pyramid
 * @features legend
 * @date     2026-09-14
 */

// Magic Numbers

/**
 * The pyramid is laid out 2px narrower than the container so that the outermost
 * bars are not clipped by the edge of the SVG.
 */
const PYRAMID_INSET = 2;
const CHART_TOP_PADDING = 25;
/** Vertical gap in pixels between the bottom of the chart area and the colour legend. */
const LEGEND_OFFSET = 60;
const MAX_LEGEND_COLUMN_WIDTH = 300;

// Types

type Datum = {
  age: number;
  gender: string;
  group: string;
  value: number;
};

/** The two stacked sides the layout produces, in the shape the component consumes. */
type Sides = ReturnType<ReturnType<typeof sszvis.stackedPyramidLayout<Datum>>>["sides"];

type State = {
  data: Datum[];
  ages: number[];
  groups: string[];
  sides: Sides;
  maxStackedValue: number;
};

type Actions = Record<string, never>;

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bottomPadding", {
    lap: 150,
    _: 100,
  })
  .prop("numLegendRows", {
    lap: 4,
    _: 2,
  });

// Accessors

const vAcc = (d: Datum) => d.value;
const gAcc = (d: Datum) => d.gender;
const aAcc = (d: Datum) => d.age;
const stackAcc = (d: Datum) => d.group;

/** The colour scale is keyed by gender and education together, e.g. "Frauen (Andere)". */
const groupAndStackAcc = (d: Datum) => `${gAcc(d)} (${stackAcc(d)})`;

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
        const layout = sszvis.stackedPyramidLayout(gAcc, aAcc, stackAcc, vAcc)(data);

        state.data = data;
        // The pyramid has one bar per year of age, from newborns to centenarians.
        state.ages = d3.range(0, 101);
        state.groups = sszvis.set(data, groupAndStackAcc);
        state.sides = layout.sides;
        // NOTE: The maximum comes off the layout rather than off the sides array:
        // the property the array form carries does not survive being copied.
        state.maxStackedValue = layout.maxValue;
      }),

  render(state) {
    const chartDimensions = sszvis.measureDimensions(config.id);
    const props = queryProps(chartDimensions);
    const pyramidDimensions = sszvis.layoutPopulationPyramid(
      (chartDimensions.width ?? 0) - PYRAMID_INSET,
      state.ages.length,
    );
    const bounds = sszvis.bounds(
      {
        height: CHART_TOP_PADDING + pyramidDimensions.totalHeight + props.bottomPadding,
        top: CHART_TOP_PADDING,
        bottom: props.bottomPadding,
        left: pyramidDimensions.chartPadding,
        right: pyramidDimensions.chartPadding,
      },
      config.id,
    );

    // Scales

    const lengthScale = d3
      .scaleLinear()
      .domain([0, state.maxStackedValue])
      .range([0, pyramidDimensions.maxBarLength]);

    const positionScale = d3
      .scaleOrdinal<number, number>()
      .domain(state.ages)
      .range(pyramidDimensions.positions);

    const colorScale = sszvis.scaleGender6Origin().domain(state.groups);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Bevölkerung der Stadt Zürich nach Alter, Geschlecht und Ausbildung",
        description: "Anzahl Frauen und Männer je Altersjahr, gestapelt nach Ausbildungsstand.",
      })
      .datum(state.sides);

    // Components

    const pyramid = sszvis
      .stackedPyramid<Datum>()
      .barFill((d) => String(colorScale(groupAndStackAcc(d))))
      .barPosition((row) => positionScale(Number(row)))
      .barHeight(pyramidDimensions.barHeight)
      .barWidth((value) => lengthScale(value ?? 0))
      .leftAccessor((sides) => sides[0])
      .rightAccessor((sides) => sides[1]);

    const xAxis = sszvis.axisX
      .pyramid()
      .scale(lengthScale)
      .orient("bottom")
      .title("Anzahl")
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
      .orientation("vertical")
      .rows(props.numLegendRows)
      .columnWidth(Math.min(bounds.innerWidth / 2, MAX_LEGEND_COLUMN_WIDTH));

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
