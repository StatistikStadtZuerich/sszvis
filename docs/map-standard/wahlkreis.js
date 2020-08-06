module.exports = function (d3, topojson, sszvis) {
  /* Configuration
  ----------------------------------------------- */

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

  /* Application state
  ----------------------------------------------- */
  var state = {
    data: null,
    mapData: null,
    selection: [],
    valueDomain: [0, 1],
  };

  /* State transitions
  ----------------------------------------------- */
  var actions = {
    prepareState: function (data) {
      state.data = data;

      render(state);
    },

    prepareMapData: function (topo) {
      state.mapData = {
        features: topojson.feature(topo, topo.objects.wahlkreise),
        borders: topojson.mesh(topo, topo.objects.wahlkreise),
        lakeFeatures: topojson.mesh(topo, topo.objects.lakezurich),
        lakeBorders: topojson.mesh(topo, topo.objects.wahlkreis_lakebounds),
      };
      render(state);
    },

    selectHovered: function (d) {
      state.selection = [d.datum];
      render(state);
    },

    deselectHovered: function () {
      state.selection = [];
      render(state);
    },

    resize: function () {
      render(state);
    },
  };

  /* Data initialization
  ----------------------------------------------- */
  d3.csv("data/M_wahlkreis_fake.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);

  d3.json("../topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

  /* Render
  ----------------------------------------------- */
  function render(state) {
    if (state.data === null || state.mapData === null) {
      // loading ...
      return true;
    }

    var props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
    var bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

    // Scales

    var colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    // Layers

    var chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

    var tooltipLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.selection);

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
      .visible(isSelected);

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

    sszvis.viewport.on("resize", actions.resize);
  }

  function isSelected(d) {
    return state.selection.indexOf(d.datum) >= 0;
  }
};
