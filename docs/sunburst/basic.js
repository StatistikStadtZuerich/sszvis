/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

function parseRow(d) {
  return {
    continent: d["kontinent"],
    region: d["region"],
    country: d["land"],
    number: sszvis.parseNumber(d["anzahl"]),
  };
}

var continentAcc = sszvis.prop("continent");
var regionAcc = sszvis.prop("region");
var countryAcc = sszvis.prop("country");
var numAcc = sszvis.prop("number");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  radiusExtent: [0, 0],
  selection: [],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState (data) {
    var continentsList = ["Europa", "Asien", "Amerika", "Afrika", "Ozeanien", "Unzuteilbar"];

    // Sort the input data according to the desired order of the continents first, then by descending order of size
    data.sort((a, b) => {
      var indexDiff = d3.ascending(
        continentsList.indexOf(continentAcc(a)),
        continentsList.indexOf(continentAcc(b))
      );
      if (indexDiff !== 0) return indexDiff;
      return d3.descending(numAcc(a), numAcc(b));
    });

    state.continents = continentsList;

    state.data = sszvis
      .sunburstPrepareData()
      .layer(continentAcc)
      .layer(regionAcc)
      .layer(countryAcc)
      .value(numAcc)
      .calculate(data);

    state.radiusExtent = sszvis.sunburstGetRadiusExtent(state.data);

    render(state);
  },

  onSliceOver (e, d) {
    state.selection = [d];

    render(state);
  },

  onSliceOut () {
    state.selection = [];

    render(state);
  },

  resize () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  var legendLayout = sszvis.colorLegendLayout(
    {
      legendLabels: state.continents,
    },
    config.id
  );

  var colorScale = legendLayout.scale;
  var colorLegend = legendLayout.legend;

  var bounds = sszvis.bounds(
    { top: 20, right: 20, bottom: legendLayout.bottomPadding, left: 20 },
    config.id
  );

  var burstLayout = sszvis.sunburstLayout(3, Math.min(bounds.innerWidth, bounds.innerHeight));

  // Scales

  var radiusScale = d3
    .scaleLinear()
    .domain(state.radiusExtent)
    .range([0, burstLayout.numLayers * burstLayout.ringWidth]);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

  var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components
  // Note: the angleScale property has a sensible default, but should be
  // configured if you're not using sszvis.sunburstLayout
  var sunburstMaker = sszvis
    .sunburst()
    .fill(colorScale)
    .radiusScale(radiusScale)
    .centerRadius(burstLayout.centerRadius);

  var tooltipText = sszvis.modularTextHTML().bold((d) => d.data.key);

  var tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .visible(isSelected)
    .header(tooltipText)
    .body((d) => sszvis.formatNumber(d.value));

  // Rendering

  var sunburstGroup = chartLayer
    .selectGroup("sunburst")
    .attr("transform", sszvis.translateString(bounds.innerWidth / 2, bounds.innerHeight / 2))
    .call(sunburstMaker);

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(
        (bounds.innerWidth - legendLayout.legendWidth) / 2,
        bounds.innerHeight + 20
      )
    )
    .call(colorLegend);

  sunburstGroup.selectAll("[data-tooltip-anchor]").call(tooltip);

  // Interaction

  var interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-sunburst-arc")
    .on("start", actions.onSliceOver)
    .on("pan", actions.onSliceOver)
    .on("end", actions.onSliceOut);

  sunburstGroup.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return state.selection.includes(d);
}
