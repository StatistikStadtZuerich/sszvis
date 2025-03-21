/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _(width) {
      const innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: 90,
        bottom: 30,
        height: 90 + innerHeight + 30,
      };
    },
  })
  .prop("legendX", {
    _: (width) => Math.max(width / 2 - 205, 5),
  })
  .prop("radiusMax", {
    _: (width) => Math.min(14, Math.max(width / 28, 10)),
  })
  .prop("control", {
    palm: () => sszvis.selectMenu,
    _: () => sszvis.buttonGroup,
  })
  .prop("controlWidth", {
    _: (width) => Math.min(width, sszvis.aspectRatioSquare.MAX_HEIGHT),
  });

function parseRow(d) {
  return {
    id: sszvis.parseNumber(d["statistischeZoneId"]),
    year: sszvis.parseNumber(d["Jahr"]),
    gender: d["Geschlecht"],
    births: sszvis.parseNumber(d["Geburten"]),
    zonename: d["statistischeZoneName"],
  };
}

const datumAcc = sszvis.prop("datum");
const yearAcc = sszvis.prop("year");
const genderAcc = sszvis.prop("gender");
const birthsAcc = sszvis.propOr("births", 0);
const zoneNameAcc = sszvis.propOr("zonename", "--");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  filteredData: [],
  selection: [],
  currentFilter: "Weiblich 1993",
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareData(data) {
    state.data = data;
    state.birthsRange = [0, d3.max(state.data, birthsAcc)];

    actions.setFilter(null, state.currentFilter);
  },

  prepareMapData(topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.statistische_zonen),
      borders: topojson.mesh(topo, topo.objects.statistische_zonen),
    };
    render(state);
  },

  setFilter(_event, filterValue) {
    state.currentFilter = filterValue;
    const filter = filterValue.toLowerCase().split(" ");
    const gender = filter[0];
    const year = Number.parseInt(filter[1]);

    state.filteredData = state.data.filter((d) => genderAcc(d) === gender && yearAcc(d) === year);

    render(state);
  },

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
d3.csv("data/births_year_statisticalZones.csv", parseRow)
  .then(actions.prepareData)
  .catch(sszvis.loadError);

d3.json("../static/topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

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
  // Any time you visualize a quantity using a circle, you should make the total
  // area of the circle proportional to the data value. Be sure to avoid using the
  // radius or the diameter to encode the data value, because the consequent quadratic
  // scaling of the area affects the visual perception of the quantity in undesirable ways.
  // This scale takes the square root of the input and uses that to scale the radius. When the
  // result is used as the radius of a circle, the area of the circle will be linearly
  // proportional to the input quantity.
  const radiusScale = d3.scaleSqrt().domain(state.birthsRange).range([0, props.radiusMax]);

  // Layers

  const chartLayer = sszvis
    .createSvgLayer("#sszvis-chart", bounds, {
      key: "chartlayer",
    })
    .datum(state.filteredData);

  const tooltipLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.selection);

  // Components

  const bubbleMap = sszvis
    .mapRendererBubble()
    .fill(sszvis.scaleQual6()(0))
    .radius((d) => (sszvis.defined(d) ? radiusScale(birthsAcc(d)) : 0))
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width));

  const choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .keyName("id")
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill((d) => (isSelected(d) ? sszvis.scaleDimGry()(0) : sszvis.scaleGry()(0)))
    .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
    .transitionColor(false)
    .anchoredShape(bubbleMap);

  const tooltipHeader = sszvis
    .modularTextHTML()
    .plain((geod) => birthsAcc(geod.datum) + " Geburten");

  const tooltipBody = sszvis.modularTextHTML().plain((geod) => zoneNameAcc(geod.datum));

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(tooltipBody)
    .visible(sszvis.compose(isSelected, datumAcc));

  const control = props
    .control()
    .values(["Männlich 1993", "Weiblich 1993", "Männlich 2014", "Weiblich 2014"])
    .current(state.currentFilter)
    .width(props.controlWidth)
    .change(actions.setFilter);

  const radiusLegend = sszvis
    .legendRadius()
    .scale(radiusScale)
    .tickFormat(sszvis.formatPreciseNumber(1));

  // Rendering

  chartLayer.call(choroplethMap);

  chartLayer
    .selectGroup("radiusLegend")
    .attr("transform", sszvis.translateString(props.legendX, bounds.innerHeight - 65))
    .call(radiusLegend);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  tooltipLayer
    .selectDiv("controls")
    .style("left", (bounds.innerWidth - control.width()) / 2 + "px")
    .style("top", 20 - bounds.padding.top + "px")
    .call(control);

  // Interaction

  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-map__area, .sszvis-anchored-circle")
    .on("start", actions.selectHovered)
    .on("pan", actions.selectHovered)
    .on("end", actions.deselectHovered);

  chartLayer.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return sszvis.defined(d) && state.selection.includes(d);
}
