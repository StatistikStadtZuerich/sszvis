/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

const MAX_LEGEND_WIDTH = 320;
const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _(width) {
      // The calculation of the rastermap bounds is a bit more complex due to the fact
      // that we have to deal with a raster image in the background that has a bigger
      // size than the vector map.
      //
      // At the maximum map size (420x420px) the raster image overlaps the image by
      // the magic padding numbers below. At smaller sizes, we apply a scale factor
      // to calculate the respective paddings.
      const scale = width / (sszvis.aspectRatioSquare.MAX_HEIGHT + 49 + 42);

      const padding = {
        top: Math.min(36 * scale, 36),
        right: 49 * scale,
        bottom: 60 + Math.min(31 * scale, 31),
        left: 42 * scale,
      };

      const innerWidth = width - padding.left - padding.right;
      const innerHeight = sszvis.aspectRatioSquare(innerWidth);

      // We always want a 1:1 ratio, so we restrict the innerWidth to the max height
      // by increasing the horizontal padding.
      if (innerHeight < innerWidth) {
        const excessPadding = innerWidth - innerHeight;
        padding.right = padding.right + excessPadding / 2;
        padding.left = padding.left + excessPadding / 2;
      }

      return {
        top: padding.top,
        bottom: padding.bottom,
        left: padding.left,
        right: padding.right,
        height: padding.top + innerHeight + padding.bottom,
      };
    },
  })
  .prop("legendWidth", {
    _: (width) => Math.min(width / 2, MAX_LEGEND_WIDTH),
  });

function parseRow(d) {
  return {
    xpos: sszvis.parseNumber(d["xkoord"]),
    ypos: sszvis.parseNumber(d["ykoord"]),
    val: sszvis.parseNumber(d["kinder"]),
  };
}

const xAcc = sszvis.prop("xpos");
const yAcc = sszvis.prop("ypos");
const valAcc = sszvis.prop("val");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  valueDomain: [0, 0],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareData(data) {
    state.data = data;
    state.valueDomain = d3.extent(data, valAcc);

    render(state);
  },

  prepareMapData(topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.stadtkreise),
      borders: topojson.mesh(topo, topo.objects.stadtkreise),
      lakeFeatures: topojson.feature(topo, topo.objects.lakezurich),
      lakeBorders: topojson.mesh(topo, topo.objects.stadtkreis_lakebounds),
    };
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv("data/kinder.csv", parseRow).then(actions.prepareData).catch(sszvis.loadError);

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

  const alphaScale = d3.scaleLinear().domain(state.valueDomain).range([0, 1]);

  // Scale the color values as well as the alpha values
  const valueScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

  // Uses a single color value
  // let solidBlue = sszvis.scaleQual12()(0);

  function colorScale(v) {
    return sszvis.withAlpha(valueScale(v), alphaScale(v));
  }

  // Layers

  const htmlLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.data);

  const chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds);

  // Components

  const choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .lakeFeatures(state.mapData.lakeFeatures)
    .lakeBorders(state.mapData.lakeBorders)
    .lakeFadeOut(true)
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .fill("none")
    .borderColor("#545454")
    .lakePathColor("#545454");

  const mapPath = sszvis.swissMapPath(
    bounds.innerWidth,
    bounds.innerHeight,
    state.mapData.features,
    "zurichStadtfeatures"
  );
  const projection = mapPath.projection();

  // Offset is applied for better alignment with the map data
  const geoOffset = -0.0011;

  function getRoundVal(val) {
    return [roundPow10(xAcc(val) + geoOffset, 5), roundPow10(yAcc(val) + geoOffset, 5)];
  }

  const layerBounds = [
    [8.431_443 + geoOffset, 47.448_978 + geoOffset],
    [8.647_471 + geoOffset, 47.309_726 + geoOffset],
  ];
  // To calculate the length in pixels of a certain distance in meters, use this function.
  // You need to provide a projection (for calculating pixel values from decimal degree coordinates)
  // and you need to provide a center point. The center point is required because the pixel size of
  // a given degree distance will be different if that square is at the equator or at one of the poles.
  const pixelSide = sszvis.pixelsFromGeoDistance(
    projection,
    [(layerBounds[0][0] + layerBounds[1][0]) / 2, (layerBounds[0][1] + layerBounds[1][1]) / 2],
    50
  );

  const rasterLayer = sszvis
    .mapRendererRaster()
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .position(sszvis.compose(projection, getRoundVal))
    .cellSide(pixelSide)
    .fill(sszvis.compose(colorScale, valAcc));

  const topoLayer = sszvis
    .mapRendererImage()
    .projection(projection)
    .src("data/topo_layer_280915.png")
    // Expects longitude, latitude
    .geoBounds(layerBounds)
    .opacity(0.4);

  const legend = sszvis
    .legendColorLinear()
    .scale(valueScale)
    .width(props.legendWidth)
    .labelFormat(sszvis.formatNumber);

  // Rendering

  const DEBUG = false;

  if (DEBUG) {
    chartLayer
      .selectAll(".sszvis-debug-layer-rect")
      .data([0])
      .enter()
      .append("rect")
      .attr("class", "sszvis-debug-layer-rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", bounds.innerWidth)
      .attr("height", bounds.innerHeight)
      .attr("fill", "rgba(0, 0, 255, 0.2)");

    rasterLayer.debug(DEBUG);

    const circlePos = projection([8.537_617, 47.383_303]);

    chartLayer
      .append("circle")
      .attr("cx", circlePos[0])
      .attr("cy", circlePos[1])
      .attr("r", 2)
      .attr("stroke", "#00ffff")
      .attr("stroke-width", 1)
      .attr("fill", "none");
  }

  htmlLayer.call(topoLayer);

  htmlLayer.call(rasterLayer);

  chartLayer.call(choroplethMap);

  chartLayer
    .selectGroup("legend")
    .attr(
      "transform",
      sszvis.translateString(
        (bounds.innerWidth - props.legendWidth) / 2,
        bounds.innerHeight + bounds.padding.bottom - 40
      )
    )
    .call(legend);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function roundPow10(n, pow10) {
  const divisor = Math.pow(10, pow10);
  return Math.round(n * divisor) / divisor;
}
