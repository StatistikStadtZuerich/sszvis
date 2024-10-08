/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

const queryProps = sszvis.responsiveProps().prop("bounds", {
  _(width) {
    const innerHeight = sszvis.aspectRatioPortrait(width);
    return {
      top: 10,
      bottom: 64,
      height: 10 + innerHeight + 64,
    };
  },
});

function parseRow(d) {
  return {
    geoId: sszvis.parseNumber(d["Nr"]),
    name: d["Gemeinde"],
    category: d["Klasse"],
    value: sszvis.parseNumber(d["Wert"]),
  };
}

const cAcc = sszvis.prop("category");
const vAcc = sszvis.prop("value");
const nameAcc = sszvis.prop("name");
const mDatumAcc = sszvis.prop("datum");
const catName = sszvis.prop("name");
const catValue = sszvis.prop("value");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  selection: [],
  valueDomain: [0, 0],
  binEdges: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.valueDomain = [d3.min(state.data, vAcc), d3.max(state.data, vAcc)];
    state.categories = sszvis
      .cascade()
      .arrayBy(cAcc)
      .apply(state.data)
      .map((d) => ({
        name: cAcc(d[0]),
        value: d3.min(d, vAcc),
      }))
      .sort((a, b) => d3.ascending(catValue(a), catValue(b)));

    render(state);
  },

  prepareMapData(topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.agglomeration),
      borders: topojson.mesh(topo, topo.objects.agglomeration),
      lakeFeatures: topojson.feature(topo, topo.objects.lakezurich_lakegreifen),
      lakeBounds: topojson.mesh(topo, topo.objects.lakezurich_lakegreifen),
    };
    render(state);
  },

  // manage which datum is selected. These data are highlighted by the map.
  selectHovered(_event, d) {
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
d3.csv("data/agglomeration_2012.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);

d3.json("../static/topo/agglomeration-zurich.json")
  .then(actions.prepareMapData)
  .catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.data === null || state.mapData === null) {
    // loading ...
    return true;
  }

  const props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
  const bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

  // Scales

  const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

  const categoryColorScale = d3
    .scaleOrdinal()
    .domain(state.categories.map(catName))
    .range(state.categories.map(sszvis.compose(colorScale, catValue)));

  // Layers

  const chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  const tooltipLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.selection);

  // Components

  const choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .lakeFeatures(state.mapData.lakeFeatures)
    // .lakeBounds(state.mapData.lakeBounds)
    .highlight(state.selection)
    // gets the fill color and darken it
    .highlightStroke(sszvis.compose(sszvis.muchDarker, colorScale, vAcc))
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
    .highlightStrokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width) + 1)
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill(sszvis.compose(colorScale, vAcc));

  const tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(nameAcc, mDatumAcc));

  const tooltipBody = (d) => {
    const value = sszvis.compose(vAcc, mDatumAcc);
    return [["Anteil 75-jährige und Ältere", sszvis.formatPercent(value(d))]];
  };

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

  const numColumns = 3;
  const columnWidth = Math.min(bounds.innerWidth / numColumns, 100);

  const legend = sszvis
    .legendColorOrdinal()
    .scale(categoryColorScale)
    .orientation("vertical")
    .rows(state.categories.length / numColumns)
    .columnWidth(columnWidth)
    .columns(numColumns);

  // Rendering

  chartLayer
    .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
    .call(choroplethMap);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("legend")
    .attr(
      "transform",
      sszvis.translateString(
        (bounds.innerWidth - columnWidth * numColumns) / 2,
        bounds.innerHeight + 20
      )
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
