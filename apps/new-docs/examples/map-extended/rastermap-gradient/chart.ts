/**
 * Raster map of Zurich where each 50m cell is shaded by a continuous colour gradient.
 *
 * @sszvis   3.5.1
 * @chart    map-extended
 * @features legend, raster-layer, image-layer
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_LEGEND_WIDTH = 320;
/** Height reserved below the map for the colour legend, in px. */
const LEGEND_SPACE = 60;
/**
 * The topographic image is wider than the vector map. At the maximum map size
 * (420x420px) it overlaps by these paddings, in px; smaller maps scale them down.
 */
const IMAGE_OVERLAP = { top: 36, right: 49, bottom: 31, left: 42 };
/** Longitude/latitude offset, in degrees, that aligns the raster with the map data. */
const GEO_OFFSET = -0.0011;
/** The geographic extent the topographic image covers, as [lon, lat] corner pairs. */
const LAYER_BOUNDS: [[number, number], [number, number]] = [
  [8.431_443 + GEO_OFFSET, 47.448_978 + GEO_OFFSET],
  [8.647_471 + GEO_OFFSET, 47.309_726 + GEO_OFFSET],
];
/** The side length of one raster cell, in meters. */
const CELL_SIDE_METERS = 50;
/** Decimal places the cell coordinates are rounded to, so cells snap onto a common grid. */
const COORDINATE_PRECISION = 5;

// Types

type MapData = {
  features: ReturnType<typeof topojson.feature>;
  borders: ReturnType<typeof topojson.mesh>;
  lakeFeatures: ReturnType<typeof topojson.feature>;
  lakeBorders: ReturnType<typeof topojson.mesh>;
};

type Datum = {
  xpos: number;
  ypos: number;
  val: number;
};

type State = {
  data: Datum[];
  mapData: MapData | null;
  valueDomain: [number, number];
};

type Actions = Record<string, never>;

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width: number) => {
      const scale =
        width / (sszvis.aspectRatioSquare.MAX_HEIGHT + IMAGE_OVERLAP.right + IMAGE_OVERLAP.left);

      const padding = {
        top: Math.min(IMAGE_OVERLAP.top * scale, IMAGE_OVERLAP.top),
        right: IMAGE_OVERLAP.right * scale,
        bottom: LEGEND_SPACE + Math.min(IMAGE_OVERLAP.bottom * scale, IMAGE_OVERLAP.bottom),
        left: IMAGE_OVERLAP.left * scale,
      };

      const innerWidth = width - padding.left - padding.right;
      const innerHeight = sszvis.aspectRatioSquare(innerWidth);

      // NOTE: The map is always 1:1, so once the height is capped the surplus width is
      // pushed into the horizontal padding rather than stretching the map.
      if (innerHeight < innerWidth) {
        const excessPadding = (innerWidth - innerHeight) / 2;
        padding.right = padding.right + excessPadding;
        padding.left = padding.left + excessPadding;
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
    _: (width: number) => Math.min(width / 2, MAX_LEGEND_WIDTH),
  });

// Accessors

const xAcc = (d: Datum) => d.xpos;
const yAcc = (d: Datum) => d.ypos;
const vAcc = (d: Datum) => d.val;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        xpos: sszvis.parseNumber(d["xkoord"]),
        ypos: sszvis.parseNumber(d["ykoord"]),
        val: sszvis.parseNumber(d["kinder"]),
      })),
      d3.json<Topology>("/preview/_static/topo/stadt-zurich.json"),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error("The city topology could not be loaded");
      }
      state.data = data;
      state.valueDomain = [d3.min(data, vAcc) ?? 0, d3.max(data, vAcc) ?? 0];
      state.mapData = {
        features: topojson.feature(topo, topo.objects["stadtkreise"]),
        borders: topojson.mesh(topo, topo.objects["stadtkreise"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["stadtkreis_lakebounds"]),
      };
    }),

  render(state) {
    if (state.mapData === null) {
      return;
    }

    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    // NOTE: Cells are shaded by colour and by opacity at once, so that low values fade into
    // the topographic image underneath instead of covering it with a pale blue.
    const alphaScale = d3.scaleLinear().domain(state.valueDomain).range([0, 1]);
    const valueScale = sszvis.scaleSeqBlu().domain(state.valueDomain);
    const colorScale = (v: number) => sszvis.withAlpha(valueScale(v), alphaScale(v));

    // Layers

    const htmlLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.data);

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Kinder in der Stadt Zürich",
      description: "Anzahl Kinder je Rasterzelle von 50 auf 50 Metern.",
    });

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
      // Drawn for its outline over the layer below it, not to paint values, so its entities are
      // never missing anything and must not be textured.
      .encodesData(false)
      .fill("none")
      .borderColor("#545454")
      .lakePathColor("#545454");

    const projection = sszvis.swissMapProjection(
      bounds.innerWidth,
      bounds.innerHeight,
      state.mapData.features,
      "zurichStadtfeatures",
    );

    // NOTE: A distance in meters has no fixed pixel size, so the cell side is measured from the
    // projection at the centre of the raster - the same square is larger at the equator.
    const pixelSide = sszvis.pixelsFromGeoDistance(
      projection,
      [
        (LAYER_BOUNDS[0][0] + LAYER_BOUNDS[1][0]) / 2,
        (LAYER_BOUNDS[0][1] + LAYER_BOUNDS[1][1]) / 2,
      ],
      CELL_SIDE_METERS,
    );

    const rasterLayer = sszvis
      .mapRendererRaster<Datum>()
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .position((d) => projection(cellCenter(d)))
      .cellSide(pixelSide)
      .fill((d) => colorScale(vAcc(d)));

    const topoLayer = sszvis
      .mapRendererImage()
      .projection(projection)
      .src("/preview/_static/topo_layer_280915.png")
      // Expects longitude, latitude
      .geoBounds(LAYER_BOUNDS)
      .opacity(0.4);

    const legend = sszvis
      .legendColorLinear()
      .scale(valueScale)
      .width(props.legendWidth)
      .labelFormat(sszvis.formatNumber);

    // Rendering

    htmlLayer.call(topoLayer);

    htmlLayer.call(rasterLayer);

    chartLayer.call(choroplethMap);

    chartLayer
      .selectGroup("legend")
      .attr(
        "transform",
        sszvis.translateString(
          (bounds.innerWidth - props.legendWidth) / 2,
          bounds.innerHeight + bounds.padding.bottom - 40,
        ),
      )
      .call(legend);
  },
});

// Helper functions

/**
 * The geographic centre of a raster cell, offset onto the map data and rounded so that
 * neighbouring rows and columns land on exactly the same grid line.
 */
const cellCenter = (d: Datum): [number, number] => [
  roundTo(xAcc(d) + GEO_OFFSET, COORDINATE_PRECISION),
  roundTo(yAcc(d) + GEO_OFFSET, COORDINATE_PRECISION),
];

const roundTo = (n: number, decimals: number) => {
  const divisor = 10 ** decimals;
  return Math.round(n * divisor) / divisor;
};
