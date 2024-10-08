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
  // Formatting function to use for the legend label. In this example, it defaults
  // to "sszvis.formatPercent" to render values from 0–100 as 0–100%, for other
  // values "sszvis.formatNumber" is maybe more appropriate
  .prop("labelFormat", {
    _: () => sszvis.formatFractionPercent,
  })
  .prop("tooltipUnit", {
    _: "Ausländeranteil",
  });

function parseRow(d) {
  return {
    quarternum: sszvis.parseNumber(d["Qcode"]),
    quartername: d["Qname"],
    value: sszvis.parseNumber(d["Ausländeranteil"]),
  };
}
const vAcc = sszvis.prop("value");
const qnameAcc = sszvis.prop("quartername");
const mDatumAcc = sszvis.prop("datum");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  valueDomain: [0, 0],
  selection: [],
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
      features: topojson.feature(topo, topo.objects.statistische_quartiere),
      borders: topojson.mesh(topo, topo.objects.statistische_quartiere),
      lakeFeatures: topojson.feature(topo, topo.objects.lakezurich),
      lakeBorders: topojson.mesh(topo, topo.objects.statistische_quartiere_lakebounds),
    };
    render(state);
  },

  selectHovered(e, d) {
    state.selection = [d.datum];
    render(state);
  },

  deselectHovered() {
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
    .keyName("quarternum")
    .highlight(state.selection)
    .highlightStroke((d) => {
      // checks for undefined values and makes those white
      const v = vAcc(d);
      return isNaN(v) ? "white" : sszvis.muchDarker(colorScale(vAcc(d)));
    })
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .defined(
      (d) =>
        // some of the values are empty in the .csv file. When parsed as a number,
        // undefined or empty string values become NaN
        !isNaN(vAcc(d))
    )
    .fill(sszvis.compose(colorScale, vAcc));

  // see the comment by the tooltip in docs/map-standard/kreis.html for more information
  // about accesing data properties of map entities.
  const tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(qnameAcc, mDatumAcc));

  const tooltipBody = sszvis
    .modularTextHTML()
    .plain(
      sszvis.compose(
        (v) => (isNaN(v) ? "keine Daten" : sszvis.formatFractionPercent(v)),
        vAcc,
        mDatumAcc
      )
    )
    .plain(sszvis.compose((v) => (isNaN(v) ? null : props.tooltipUnit), vAcc, mDatumAcc));

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
