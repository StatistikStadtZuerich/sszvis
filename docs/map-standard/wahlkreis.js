/* global d3, topojson, sszvis, config */

// Configuration
// -----------------------------------------------

var MAX_LEGEND_WIDTH = 320;
var queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: function (width) {
      var innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: 30,
        bottom: 90,
        height: 30 + innerHeight + 90,
      };
    },
  })
  .prop("legendWidth", {
    _: function (width) {
      return Math.min(width / 2, MAX_LEGEND_WIDTH);
    },
  });

function parseRow(d) {
  return {
    name: d["ID"],
    // magic number 20 here is based on the range of the fake data. It transforms the values into percentages
    value: sszvis.parseNumber(d["Value"]) / 20,
  };
}

var vAcc = sszvis.prop("value");
var nameAcc = sszvis.prop("name");
var mDatumAcc = sszvis.prop("datum");

sszvis.app({
  fallback: {
    element: config.id,
    src: config.fallback,
  },

  // Init
  // -----------------------------------------------
  init: function () {
    return Promise.all([d3.csv(config.data, parseRow), d3.json("../topo/stadt-zurich.json")]).then(
      function (result) {
        const data = result[0];
        const topo = result[1];
        return {
          data: data,
          mapData: {
            features: topojson.feature(topo, topo.objects.wahlkreise),
            borders: topojson.mesh(topo, topo.objects.wahlkreise),
            lakeFeatures: topojson.mesh(topo, topo.objects.lakezurich),
            lakeBorders: topojson.mesh(topo, topo.objects.wahlkreis_lakebounds),
          },
          selection: [],
          valueDomain: [0, 1],
        };
      }
    );
  },

  // Actions
  // -----------------------------------------------
  actions: {
    selectHovered: function (state, d) {
      state.selection = [d.datum];
      return state;
    },

    deselectHovered: function (state) {
      state.selection = [];
      return state;
    },
  },

  // Render
  // -----------------------------------------------
  render: function (state, actions) {
    if (state.data === null || state.mapData === null) {
      // loading ...
      return true;
    }

    var props = queryProps(sszvis.measureDimensions(config.id));
    var bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    var colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    // Layers

    var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

    var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    var choroplethMap = sszvis
      .choropleth()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .lakeBorders(state.mapData.lakeBorders)
      .keyName("name")
      .highlight(state.selection)
      .highlightStroke(sszvis.compose(sszvis.muchDarker, colorScale, vAcc))
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .fill(sszvis.compose(colorScale, vAcc));

    // see the comment by the tooltip in docs/map-standard/kreis.html for more information
    // about accesing data properties of map entities.
    var tooltipHeader = sszvis
      .modularTextHTML()
      .bold(sszvis.compose(sszvis.formatFractionPercent, vAcc, mDatumAcc));

    var tooltipBody = sszvis
      .modularTextHTML()
      .plain("Wahlkreis ")
      .plain(sszvis.compose(nameAcc, mDatumAcc));

    var tooltip = sszvis
      .tooltip()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body(tooltipBody)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible(isSelected(state));

    var legend = sszvis
      .legendColorLinear()
      .scale(colorScale)
      .width(props.legendWidth)
      .labelFormat(sszvis.formatFractionPercent);

    // Rendering

    chartLayer
      .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
      .call(choroplethMap);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("legend")
      .attr(
        "transform",
        sszvis.translateString(bounds.width / 2 - props.legendWidth / 2, bounds.innerHeight + 60)
      )
      .call(legend);

    // Interaction

    var interactionLayer = sszvis
      .panning()
      .elementSelector(".sszvis-map__area")
      .on("start", actions.selectHovered)
      .on("pan", actions.selectHovered)
      .on("end", actions.deselectHovered);

    chartLayer.call(interactionLayer);
  },
});

// Helpers
// -----------------------------------------------

function isSelected(state) {
  return function (d) {
    return state.selection.indexOf(d.datum) >= 0;
  };
}
