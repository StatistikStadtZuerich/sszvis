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
    kinder: sszvis.parseNumber(d["kinder"]),
  };
}

const xAcc = sszvis.prop("xpos");
const yAcc = sszvis.prop("ypos");
const kinderAcc = sszvis.prop("kinder");

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
    state.valueDomain = d3.extent(data, kinderAcc);

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
d3.csv("data/kinder200.csv", parseRow).then(actions.prepareData).catch(sszvis.loadError);

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

  // Use the binned scale heat table example as a reference for a more in-depth description of setting
  // up a binned color scale. For detailed comments on creating the bin scales, see rastermap-bins.html

  const numBins = 5;
  const binStep = Math.ceil(((state.valueDomain[1] - state.valueDomain[0]) / numBins) * 100) / 100;
  const binEdges = d3.range(
    state.valueDomain[0] + binStep,
    state.valueDomain[0] + binStep * numBins,
    binStep
  );
  const interpolateColor = sszvis
    .scaleDivValGry()
    .reverse()
    .domain([0, numBins - 1]);
  const binColors = d3.range(0, numBins).map(interpolateColor);

  const colorScale = d3.scaleThreshold().domain(binEdges).range(binColors);

  // Layers

  // Create an HTML layer that lives at the bottom. This will contain
  // the topographic image and the canvas raster layer
  const htmlUnderLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds).datum(state.data);

  // Create an SVG layer. This will contain the city outline
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
    .borderColor("#fff");

  const mapPath = sszvis.swissMapPath(
    bounds.innerWidth,
    bounds.innerHeight,
    state.mapData.features,
    "zurichStadtfeatures"
  );
  const projection = mapPath.projection();

  function roundPow10(n, pow10) {
    const divisor = Math.pow(10, pow10);
    return Math.round(n * divisor) / divisor;
  }

  // Offset is applied for better alignment with the map data
  const geoOffset = -0.0011;

  function getRoundVal(val) {
    return [roundPow10(xAcc(val) + geoOffset, 5), roundPow10(yAcc(val) + geoOffset, 5)];
  }

  const layerBounds = [
    [8.431_443 + geoOffset, 47.448_978 + geoOffset],
    [8.647_471 + geoOffset, 47.309_726 + geoOffset],
  ];
  const pixelSide = sszvis.pixelsFromGeoDistance(
    projection,
    [(layerBounds[0][0] + layerBounds[1][0]) / 2, (layerBounds[0][1] + layerBounds[1][1]) / 2],
    200
  );

  const rasterLayer = sszvis
    .mapRendererRaster()
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .position(sszvis.compose(projection, getRoundVal))
    .cellSide(pixelSide)
    .fill(sszvis.compose(colorScale, kinderAcc))
    .opacity(0.6);

  const topoLayer = sszvis
    .mapRendererImage()
    .projection(projection)
    .src("data/topo_layer_280915.png")
    // Expects longitude, latitude
    .geoBounds(layerBounds)
    .opacity(0.4);

  const legend = sszvis
    .legendColorBinned()
    .scale(colorScale)
    .displayValues(binEdges)
    .endpoints(state.valueDomain)
    .width(props.legendWidth)
    .labelFormat(sszvis.formatNumber);

  // Rendering

  htmlUnderLayer.call(topoLayer);

  htmlUnderLayer.call(rasterLayer);

  chartLayer.selectGroup("outline").call(choroplethMap);

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
