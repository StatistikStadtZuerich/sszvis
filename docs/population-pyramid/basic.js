/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

var queryProps = sszvis
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

var vAcc = sszvis.prop("value");
var gAcc = sszvis.prop("gender");
var aAcc = sszvis.prop("age");
var womenAcc = sszvis.prop("Frauen");
var menAcc = sszvis.prop("Männer");

// Application state
// -----------------------------------------------

var state = {
  data: [],
  ages: [],
  ageExtent: [],
  groups: [],
  maxValue: 0,
  binnedData: [],
  populations: {},
  selectedAge: [],
};

// State transitions
// -----------------------------------------------

var actions = {
  prepareState: function (data) {
    state.data = data;
    state.groups = sszvis.set(state.data, gAcc).reverse();

    var grouper = sszvis
      .cascade()
      .objectBy(gAcc)
      .sort(function (a, b) {
        // Sort the groups in order of ascending age
        return d3.ascending(aAcc(a), aAcc(b));
      });

    var groupedData = grouper.apply(state.data);

    // This example bins the data into five-year age ranges.
    // It uses d3.sum to compute the value of a bin.

    // compute bins
    var binnedData = [],
      // The number of data points to include in each bin
      binStep = 5,
      // A list of age groups in the dataset, used for the y-axis scale
      ages = [],
      // A lookup index to aid in creating a smooth tooltip experience. The
      // lookup table allows us to use a continuous range of mouse input and map each
      // value to a categorical age range.
      ageLookupIndex = [];
    for (var group in groupedData) {
      // perform the binning on each group separately
      var sourceArr = groupedData[group];
      // loop through the elements in the group five at a time
      for (var i = 0, l = sourceArr.length; i < l; i += binStep) {
        // create a name for the age range
        var ageListing = aAcc(sourceArr[i]) + "–" + aAcc(sourceArr[i + binStep - 1]);
        // add the name to the list of ages
        ages.push(ageListing);
        // add the binned datum (the structure mimics that of the un-binned data)
        binnedData.push({
          age: ageListing,
          gender: group,
          // here, calculate the sum value of the slice of data
          value: d3.sum(sourceArr.slice(i, i + binStep), vAcc),
        });
        for (var indexIter = i, lastIndex = i + binStep; indexIter < lastIndex; ++indexIter) {
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

  selectBar: function (x, age) {
    // use the age lookup index to figure out which age range is closest
    // to the mouse
    var nearestAgeRange = findNearestAgeRange(age, state.ageLookupIndex);
    // find the binned data rows with that age range
    var rows = state.binnedData.filter(function (v) {
      return aAcc(v) === nearestAgeRange;
    });

    // set the data for the tooltip
    state.selectedAge = {
      age: nearestAgeRange,
      rows: rows,
    };

    render(state);
  },

  deselectBar: function () {
    state.selectedAge = [];
    render(state);
  },

  resize: function () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------

d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------

function render(state) {
  var pyramidWidth = sszvis.measureDimensions(config.id).width - 2;
  var pyramidDimensions = sszvis.layoutPopulationPyramid(pyramidWidth, state.ages.length);
  var chartPadding = { top: 25, bottom: 86 };
  var bounds = sszvis.bounds(
    {
      height: chartPadding.top + pyramidDimensions.totalHeight + chartPadding.bottom,
      top: chartPadding.top,
      bottom: chartPadding.bottom,
      left: pyramidDimensions.chartPadding,
      right: pyramidDimensions.chartPadding,
    },
    config.id
  );
  var props = queryProps(bounds);

  // Scales

  var lengthScale = d3
    .scaleLinear()
    .domain([0, state.maxValue])
    .range([0, pyramidDimensions.maxBarLength]);

  var colorScale = sszvis.scaleQual6().domain(state.groups);

  var positionScale = d3.scaleOrdinal().domain(state.ages).range(pyramidDimensions.positions);

  // For the yAxis, we create a copy of the positionScale that's used for the
  // bars and shift the output range by half the bar height to center the
  // axis labels vertically within the bars
  var yAxisLabelScale = positionScale.copy().range(
    pyramidDimensions.positions.map(function (d) {
      return d + pyramidDimensions.barHeight / 2;
    })
  );

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.populations);

  var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selectedAge);

  // Components

  var pyramid = sszvis
    .pyramid()
    .barFill(function (d) {
      var c = colorScale(gAcc(d));
      return aAcc(d) === state.selectedAge.age ? sszvis.slightlyDarker(c) : c;
    })
    .barPosition(sszvis.compose(positionScale, aAcc))
    .barHeight(pyramidDimensions.barHeight)
    .barWidth(sszvis.compose(lengthScale, vAcc))
    .tooltipAnchor(props.tooltipAnchor)
    .leftAccessor(womenAcc)
    .rightAccessor(menAcc);

  var xAxis = sszvis.axisX
    .pyramid()
    .scale(lengthScale)
    .orient("bottom")
    .title("Anzahl Frauen und Männer")
    .titleAnchor("middle")
    .titleCenter(true)
    .ticks(props.xTicks);

  var yAxis = sszvis.axisY
    .ordinal()
    .scale(yAxisLabelScale)
    .orient("right")
    .ticks(5)
    .title("Alter in Jahren")
    .dyTitle(-18);

  var colorLegend = sszvis
    .legendColorOrdinal()
    .reverse(true)
    .scale(colorScale)
    .horizontalFloat(true);

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(function (d) {
      return aAcc(d) + "-jährige";
    })
    .body(function () {
      var rows = state.selectedAge.rows.map(function (r) {
        return [gAcc(r), sszvis.formatNumber(vAcc(r))];
      });
      return [...rows, ["Alter", state.selectedAge.age]];
    })
    .orientation(props.tooltipOrientation)
    .visible(function (d) {
      return state.selectedAge.age === aAcc(d) && gAcc(d) === "Männer";
    });

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

  var mouseXScale = d3.scaleLinear().domain([0, 1]).range([0, bounds.innerWidth]);
  // using a continuous linear scale for the y mouse position ensures that the tooltip doesn't flicker on and off
  // if we were to use an ordinal scale, the tooltip would disappear while the mouse is in the spaces
  // between the bars, because the ordinal scale has no value there, while a linear scale does.
  var mouseYScale = d3.scaleLinear().domain(state.ageExtent).range([bounds.innerHeight, 0]);
  var interactionLayer = sszvis
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
  return function (xRel, age) {
    var ageBin = findNearestAgeRange(age, state.ageLookupIndex);
    var dataRow = binnedData.filter(function (d) {
      return aAcc(d) === ageBin;
    });
    var x = xRelToPx(xRel);
    return sszvis.every(function (d) {
      return isLeft(d) ? x >= xCenter - lengthScale(vAcc(d)) : x <= xCenter + lengthScale(vAcc(d));
    }, dataRow);
  };
}

function findNearestAgeRange(age, lookupIndex) {
  return lookupIndex[Math.floor(age)];
}

function isLeft(d) {
  return gAcc(d) === "Frauen";
}
