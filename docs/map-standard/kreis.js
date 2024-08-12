/* global d3, topojson, sszvis, config */

// Configuration
// -----------------------------------------------
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
    _: (width) => Math.min(width / 2, 320),
  })
  .prop("labelFormat", {
    _: () => sszvis.formatNumber,
  })
  .prop("tooltipUnit", {
    _: "Einwohner",
  });

function parseRow(d) {
  return {
    geoId: sszvis.parseNumber(d["KNr"]),
    name: d["Kname"],
    value: sszvis.parseNumber(d["Bevölkerung"]),
  };
}
const vAcc = sszvis.prop("value");
const nameAcc = sszvis.prop("name");
const mDatumAcc = sszvis.prop("datum");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  selection: [],
  valueDomain: [0, 0],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.valueDomain = [0, d3.max(state.data, vAcc)];

    render(state);
  },

  prepareMapData(topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.stadtkreise),
      borders: topojson.mesh(topo, topo.objects.stadtkreise),
      lakeFeatures: topojson.mesh(topo, topo.objects.lakezurich),
      lakeBorders: topojson.mesh(topo, topo.objects.stadtkreis_lakebounds),
    };
    render(state);
  },

  // manage which datum is selected. These data are highlighted by the map.
  selectHovered(_event, d) {
    if (state.selection[0] === d.datum) {
      return;
    }
    state.selection = [d.datum];
    render(state);
  },

  deselectHovered() {
    if (state.selection.length === 0) {
      return;
    }
    state.selection = [];
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

d3.json("../static/topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.data === null || state.mapData === null) {
    // loading ...
    return true;
  }

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
    .highlight(state.selection)
    // gets the fill color and darken it
    .highlightStroke(sszvis.compose(sszvis.muchDarker, colorScale, vAcc))
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill(sszvis.compose(colorScale, vAcc));

  const tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(nameAcc, mDatumAcc));

  const tooltipBody = sszvis
    .modularTextHTML()
    .plain(sszvis.compose(sszvis.formatNumber, vAcc, mDatumAcc))
    .plain(props.tooltipUnit);

  // When using the map component, the data element bound to the tooltip anchor is the internal representation
  // which includes both the geoJson and the datum as properties. This is necessary so that the correct position
  // can be calculated from the geoJson. But that also means that when accessing the datum for other purposes,
  // such as creating tooltip text, the user must be aware that the 'd' argument is not just the data value.
  // The data value, if present, is available as d.datum.
  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(tooltipBody)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .visible(isSelected);

  const legend = sszvis
    .legendColorLinear()
    .scale(colorScale)
    .width(props.legendWidth)
    .labelFormat(props.labelFormat);

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

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return state.selection.includes(d.datum);
}
