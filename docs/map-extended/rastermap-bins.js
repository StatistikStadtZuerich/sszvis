/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

const DEFAULT_KEY = "Kinder";
const KEY_OPTIONS = ["Kinder", "Random"];
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
        top: 74 + Math.min(36 * scale, 36),
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
  })
  .prop("controlWidth", {
    _: (width) => Math.max(200, Math.min(MAX_LEGEND_WIDTH, width / 2)),
  });

function parseRow(d) {
  return {
    xpos: sszvis.parseNumber(d["xkoord"]),
    ypos: sszvis.parseNumber(d["ykoord"]),
    kinder: sszvis.parseNumber(d["kinder"]),
    random: sszvis.parseNumber(d["random"]),
  };
}

const xAcc = sszvis.prop("xpos");
const yAcc = sszvis.prop("ypos");
const kinderAcc = sszvis.prop("kinder");
const randomAcc = sszvis.prop("random");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  valueDomain: [0, 0],
  currentKey: null,
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareData(data) {
    state.data = data;
    // Ignore the domain of the random data
    state.valueDomain = d3.extent(data, kinderAcc);

    actions.setKey(null, DEFAULT_KEY);
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

  setKey(_event, key) {
    state.currentKey = key;

    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv("data/kinder_segmented.csv", parseRow).then(actions.prepareData).catch(sszvis.loadError);

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
  // up a binned color scale.

  // Choose a number of bins
  const numBins = 5;
  // Then we need to calculate the bin edges in the data domain, and the color values for
  // each bin in the color range. We will be using d3.scale.threshold(), so bin edges shouldn't
  // include the start of the first bin or the end of the last bin. For the threshold scale,
  // the number of values in the range must be one greater than the number of values
  // in the domain.

  // Calculate a bin step (the 'width' of a single bin) which will result in the correct
  // number of bins, and round the bin step to 2 significant digits of precision.
  const binStep = Math.ceil(((state.valueDomain[1] - state.valueDomain[0]) / numBins) * 100) / 100;
  // Calculate the inner edges of the bins. We skip the beginning of the value domain,
  // and d3.range automatically leaves off the end.
  const binEdges = d3.range(
    state.valueDomain[0] + binStep,
    state.valueDomain[0] + binStep * numBins,
    binStep
  );
  // Use a color scale function on an arbitrary range to calculate a set of bin colors easily.
  // This domain is used because we want to map the integer range [0, numBins - 1].
  const interpolateColor = sszvis
    .scaleDivValGry()
    .reverse()
    .domain([0, numBins - 1]);
  // Calculate the colors of the bins using the range [0, numBins - 1]
  // d3.range(0, numBins) returns a range including the integers in [0, numBins - 1]
  const binColors = d3.range(0, numBins).map(interpolateColor);

  const colorScale = d3.scaleThreshold().domain(binEdges).range(binColors);

  // Layers

  // Create an HTML layer that lives at the bottom. This will contain
  // the topographic image and the canvas raster layer
  // For more information about the 'key' argument to the metadata object, see the
  // comment in the source code for createHtmlLayer
  const htmlUnderLayer = sszvis
    .createHtmlLayer("#sszvis-chart", bounds, {
      key: "underlayer",
    })
    .datum(state.data);

  // Create an SVG layer. This will contain the city outline
  const chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds);

  // Create an HTML layer that lives at the top of the stack. This will
  // contain the segmented control
  const htmlOverLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds, {
    key: "overlayer",
  });

  // Components

  const control = sszvis
    .buttonGroup()
    .values(KEY_OPTIONS)
    .width(props.controlWidth)
    .current(state.currentKey)
    .change(actions.setKey);

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

  const valAcc =
    state.currentKey === "Kinder"
      ? kinderAcc
      : state.currentKey === "Random"
        ? randomAcc
        : sszvis.identity;

  const layerBounds = [
    [8.431_443 + geoOffset, 47.448_978 + geoOffset],
    [8.647_471 + geoOffset, 47.309_726 + geoOffset],
  ];
  let pixelSide = sszvis.pixelsFromGeoDistance(
    projection,
    [(layerBounds[0][0] + layerBounds[1][0]) / 2, (layerBounds[0][1] + layerBounds[1][1]) / 2],
    50
  );
  // Using the half pixel crisp setting reduces some of the grid-like overlap patterning that we see with the exact measurement
  pixelSide = sszvis.halfPixel(pixelSide);

  const rasterLayer = sszvis
    .mapRendererRaster()
    .width(bounds.innerWidth)
    .height(bounds.innerHeight)
    .position(sszvis.compose(projection, getRoundVal))
    .cellSide(pixelSide)
    .fill(sszvis.compose(colorScale, valAcc))
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

  htmlUnderLayer.call(topoLayer).call(rasterLayer);

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

  htmlOverLayer
    .selectDiv("controls")
    .style("left", (bounds.innerWidth - props.controlWidth) / 2 + "px")
    .style("top", 20 - bounds.padding.top + "px")
    .call(control);

  sszvis.viewport.on("resize", actions.resize);
}
