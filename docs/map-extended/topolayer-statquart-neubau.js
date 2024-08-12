/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------
const queryProps = sszvis.responsiveProps().prop("bounds", {
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
      bottom: Math.min(31 * scale, 31),
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
});

function parseRow(d) {
  let parsedYear = sszvis.parseNumber(d["bezugsjahr"]);
  parsedYear = parsedYear === 0 ? Number.NaN : parsedYear;
  return {
    id: sszvis.parseNumber(d["id"]),
    name: d["name"],
    ownership: d["traegerschaft"],
    year: parsedYear,
  };
}

const datumAcc = sszvis.prop("datum");
const nameAcc = sszvis.prop("name");
const yearAcc = sszvis.prop("year");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  additionalMapData: null,
  selection: [],
  yearRange: [0, 0],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareData(data) {
    state.data = data;
    state.yearRange = d3.extent(data, yearAcc);

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

  prepareAdditionalMapData(geojson) {
    state.additionalMapData = {
      features: geojson,
    };
    render(state);
  },

  selectHovered(d) {
    state.selection = [d];
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
d3.csv("data/gemeinnuetzige.csv", parseRow).then(actions.prepareData).catch(sszvis.loadError);

d3.json("../static/topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

d3.json("data/gemeinnuetzige.json").then(actions.prepareAdditionalMapData).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.data === null || state.mapData === null || state.additionalMapData === null) {
    // loading ...
    return true;
  }

  const props = queryProps(sszvis.measureDimensions("#sszvis-chart"));
  const bounds = sszvis.bounds(props.bounds, "#sszvis-chart");

  // Scales
  const colorScale = sszvis.scaleSeqBlu().reverse().domain(state.yearRange);

  // Layers

  // It's important that this html layer comes first, so that it lies under the svg
  // For more information about the 'key' argument to the metadata object, see the
  // comment in the source code for createHtmlLayer
  const htmlLayer = sszvis.createHtmlLayer("#sszvis-chart", bounds, {
    key: "topolayer",
  });

  const chartLayer = sszvis.createSvgLayer("#sszvis-chart", bounds).datum(state.data);

  const tooltipLayer = sszvis
    .createHtmlLayer("#sszvis-chart", bounds, {
      key: "tooltiplayer",
    })
    .datum(state.selection);

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

  const newBuildings = sszvis
    .mapRendererGeoJson()
    .dataKeyName("id")
    .geoJsonKeyName("OBJECTID")
    .geoJson(state.additionalMapData.features)
    .mapPath(mapPath)
    .defined(sszvis.compose(sszvis.defined, yearAcc))
    .fill(sszvis.compose(colorScale, yearAcc))
    .stroke(sszvis.compose(colorScale, yearAcc))
    .strokeWidth(1.25)
    .on("over", actions.selectHovered)
    .on("click", actions.selectHovered)
    .on("out", actions.deselectHovered);

  // Offset is applied for better alignment with the map data
  const geoOffset = -0.0011;

  const layerBounds = [
    [8.431_443 + geoOffset, 47.448_978 + geoOffset],
    [8.647_471 + geoOffset, 47.309_726 + geoOffset],
  ];

  const topoLayer = sszvis
    .mapRendererImage()
    .projection(projection)
    .src("data/topo_layer_280915.png")
    // Expects longitude, latitude
    .geoBounds(layerBounds)
    .opacity(0.4);

  const tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(nameAcc, datumAcc));

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(tooltipHeader)
    .body(sszvis.compose(yearAcc, datumAcc))
    .visible(isSelected);

  // Rendering

  htmlLayer.call(topoLayer);

  chartLayer.call(choroplethMap);

  chartLayer.call(newBuildings);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return state.selection.includes(d.datum);
}
