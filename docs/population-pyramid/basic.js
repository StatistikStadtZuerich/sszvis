/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

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
  .prop("xTicks", {
    palm: 4,
    _: null, // auto
  });

function parseRow(d) {
  return {
    age: sszvis.parseNumber(d["Alter"]),
    gender: d["Geschlecht"],
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}

const vAcc = sszvis.prop("value");
const gAcc = sszvis.prop("gender");
const aAcc = sszvis.prop("age");
const womenAcc = sszvis.prop("Frauen");
const menAcc = sszvis.prop("Männer");

// Application state
// -----------------------------------------------

const state = {
  data: [],
  ages: [],
  ageExtent: [],
  maxValue: 0,
  binnedData: [],
  populations: {},
  selectedAge: [],
};

// State transitions
// -----------------------------------------------

const actions = {
  prepareState(data) {
    state.data = data;

    const grouper = sszvis
      .cascade()
      .objectBy(gAcc)
      .sort((a, b) =>
        // Sort the groups in order of ascending age
        d3.ascending(aAcc(a), aAcc(b))
      );

    const groupedData = grouper.apply(state.data);

    // This example bins the data into five-year age ranges.
    // It uses d3.sum to compute the value of a bin.
    // compute bins
    const binnedData = [],
      // The number of data points to include in each bin
      binStep = 5,
      // A list of age groups in the dataset, used for the y-axis scale
      ages = [],
      // A lookup index to aid in creating a smooth tooltip experience. The
      // lookup table allows us to use a continuous range of mouse input and map each
      // value to a categorical age range.
      ageLookupIndex = [];
    for (const group in groupedData) {
      // perform the binning on each group separately
      const sourceArr = groupedData[group];
      // loop through the elements in the group five at a time
      for (let i = 0, l = sourceArr.length; i < l; i += binStep) {
        // create a name for the age range
        const ageListing = aAcc(sourceArr[i]) + "–" + aAcc(sourceArr[i + binStep - 1]);
        // add the name to the list of ages
        ages.push(ageListing);
        // add the binned datum (the structure mimics that of the un-binned data)
        binnedData.push({
          age: ageListing,
          gender: group,
          // here, calculate the sum value of the slice of data
          value: d3.sum(sourceArr.slice(i, i + binStep), vAcc),
        });
        for (let indexIter = i, lastIndex = i + binStep; indexIter < lastIndex; ++indexIter) {
          // add the age listing (e.g. "10 - 14") to the ageLookupIndex
          // note that this overwrites whatever was already here. If one group is missing entries
          // for certain ages which the other contains, this pattern could create age lookup problems
          ageLookupIndex[aAcc(sourceArr[indexIter])] = ageListing;
        }
      }
    }

    // save data on state which will be used in later steps
    // binned data, ungrouped
    state.binnedData = binnedData;
    // group the bin data. This data set is bound to the chart
    state.populations = grouper.apply(binnedData);
    // save the age lookup index
    state.ageLookupIndex = ageLookupIndex;

    // use the unique age listings as the basis for the ordinal y-scale
    state.ages = sszvis.set(ages);
    // get the age extent (these ages are numbers, not strings) from the data
    // this is used to configure the mouseover behavior
    state.ageExtent = d3.extent(state.data, aAcc);
    // get the maximum binned value, for configuring the horizontal scale
    state.maxValue = d3.max(state.binnedData, vAcc);

    render(state);
  },

  selectBar(e, x, age) {
    // use the age lookup index to figure out which age range is closest
    // to the mouse
    const nearestAgeRange = findNearestAgeRange(age, state.ageLookupIndex);
    // find the binned data rows with that age range
    const rows = state.binnedData.filter((v) => aAcc(v) === nearestAgeRange);

    // set the data for the tooltip
    state.selectedAge = {
      age: nearestAgeRange,
      rows,
    };

    render(state);
  },

  deselectBar() {
    state.selectedAge = [];
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------

d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------

function render(state) {
  const pyramidWidth = sszvis.measureDimensions(config.id).width - 2;
  const pyramidDimensions = sszvis.layoutPopulationPyramid(pyramidWidth, state.ages.length);
  const chartPadding = { top: 25, bottom: 86 };
  const bounds = sszvis.bounds(
    {
      height: chartPadding.top + pyramidDimensions.totalHeight + chartPadding.bottom,
      top: chartPadding.top,
      bottom: chartPadding.bottom,
      left: pyramidDimensions.chartPadding,
      right: pyramidDimensions.chartPadding,
    },
    config.id
  );
  const props = queryProps(bounds);

  // Scales

  const lengthScale = d3
    .scaleLinear()
    .domain([0, state.maxValue])
    .range([0, pyramidDimensions.maxBarLength]);

  const colorScale = sszvis.scaleGender3();

  const positionScale = d3.scaleOrdinal().domain(state.ages).range(pyramidDimensions.positions);

  // For the yAxis, we create a copy of the positionScale that's used for the
  // bars and shift the output range by half the bar height to center the
  // axis labels vertically within the bars
  const yAxisLabelScale = positionScale
    .copy()
    .range(pyramidDimensions.positions.map((d) => d + pyramidDimensions.barHeight / 2));

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.populations);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selectedAge);

  // Components

  const pyramid = sszvis
    .pyramid()
    .barFill((d) => {
      const c = colorScale(gAcc(d));
      return aAcc(d) === state.selectedAge.age ? sszvis.slightlyDarker(c) : c;
    })
    .barPosition(sszvis.compose(positionScale, aAcc))
    .barHeight(pyramidDimensions.barHeight)
    .barWidth(sszvis.compose(lengthScale, vAcc))
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
    .tooltip()
    .renderInto(tooltipLayer)
    .header((d) => aAcc(d) + "-jährige")
    .body(() => {
      const rows = state.selectedAge.rows.map((r) => [gAcc(r), sszvis.formatNumber(vAcc(r))]);
      return [...rows, ["Alter", state.selectedAge.age]];
    })
    .orientation(props.tooltipOrientation)
    .visible((d) => state.selectedAge.age === aAcc(d) && gAcc(d) === "Männer");

  // Rendering

  chartLayer
    .selectGroup("populationPyramid")
    .datum(state.populations)
    .attr("transform", sszvis.translateString(bounds.innerWidth / 2, 0))
    .call(pyramid);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight))
    .call(xAxis);

  chartLayer.selectGroup("yAxis").attr("transform", sszvis.translateString(0, 0)).call(yAxis);

  chartLayer
    .selectGroup("colorLegend")
    .attr("transform", sszvis.translateString(0, bounds.innerHeight + 60))
    .call(colorLegend);

  // Interaction

  const mouseXScale = d3.scaleLinear().domain([0, 1]).range([0, bounds.innerWidth]);
  // using a continuous linear scale for the y mouse position ensures that the tooltip doesn't flicker on and off
  // if we were to use an ordinal scale, the tooltip would disappear while the mouse is in the spaces
  // between the bars, because the ordinal scale has no value there, while a linear scale does.
  const mouseYScale = d3.scaleLinear().domain(state.ageExtent).range([bounds.innerHeight, 0]);
  const interactionLayer = sszvis
    .move()
    .xScale(mouseXScale)
    .yScale(mouseYScale)
    .cancelScrolling(
      isWithinBarContour(state.binnedData, bounds.innerWidth / 2, mouseXScale, lengthScale)
    )
    .fireOnPanOnly(true)
    .on("move", actions.selectBar)
    .on("end", actions.deselectBar);

  chartLayer.selectGroup("interactionLayer").call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper Functions
// -----------------------------------------------

function isWithinBarContour(binnedData, xCenter, xRelToPx, lengthScale) {
  return (xRel, age) => {
    const ageBin = findNearestAgeRange(age, state.ageLookupIndex);
    const dataRow = binnedData.filter((d) => aAcc(d) === ageBin);
    const x = xRelToPx(xRel);
    return sszvis.every(
      (d) =>
        isLeft(d) ? x >= xCenter - lengthScale(vAcc(d)) : x <= xCenter + lengthScale(vAcc(d)),
      dataRow
    );
  };
}

function findNearestAgeRange(age, lookupIndex) {
  return lookupIndex[Math.floor(age)];
}

function isLeft(d) {
  return gAcc(d) === "Frauen";
}
