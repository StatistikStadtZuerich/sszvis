/* global d3, topojson, sszvis, config */

// Configuration
// -----------------------------------------------

const MAX_LEGEND_WIDTH = 320;
const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _(width) {
      const innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: 30,
        bottom: 90,
        height: 30 + innerHeight + 90,
      };
    },
  })
  .prop("legendWidth", {
    _: (width) => Math.min(width / 2, MAX_LEGEND_WIDTH),
  });

function parseRow(d) {
  return {
    name: d["ID"],
    // magic number 20 here is based on the range of the fake data. It transforms the values into percentages
    value: sszvis.parseNumber(d["Value"]) / 20,
  };
}

const vAcc = sszvis.prop("value");
const nameAcc = sszvis.prop("name");
const mDatumAcc = sszvis.prop("datum");

sszvis.app({
  fallback: {
    element: config.id,
    src: config.fallback,
  },

  // Init
  // -----------------------------------------------
  init: (state) =>
    Promise.all([d3.csv(config.data, parseRow), d3.json("../static/topo/stadt-zurich.json")]).then(
      (result) => {
        const data = result[0];
        const topo = result[1];
        state.data = data;
        state.mapData = {
          features: topojson.feature(topo, topo.objects.wahlkreise),
          borders: topojson.mesh(topo, topo.objects.wahlkreise),
          lakeFeatures: topojson.mesh(topo, topo.objects.lakezurich),
          lakeBorders: topojson.mesh(topo, topo.objects.wahlkreis_lakebounds),
        };
        state.selection = [];
        state.valueDomain = [0, 1];
      }
    ),

  // Actions
  // -----------------------------------------------
  actions: {
    selectHovered(state, e, d) {
      state.selection = [d.datum];
    },

    deselectHovered(state) {
      state.selection = [];
    },
  },

  // Render
  // -----------------------------------------------
  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales
    const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    // Layers
    const chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components
    const choroplethMap = sszvis
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
    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold(sszvis.compose(sszvis.formatFractionPercent, vAcc, mDatumAcc));

    const tooltipBody = sszvis
      .modularTextHTML()
      .plain("Wahlkreis ")
      .plain(sszvis.compose(nameAcc, mDatumAcc));

    const tooltip = sszvis
      .tooltip()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body(tooltipBody)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible(isSelected(state));

    const legend = sszvis
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
    const interactionLayer = sszvis
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
  return (d) => state.selection.includes(d.datum);
}
