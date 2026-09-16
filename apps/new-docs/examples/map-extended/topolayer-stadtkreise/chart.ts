/**
 * Map of the Zurich city districts drawn over a clipped topographic image layer.
 *
 * @sszvis   3.5.1
 * @chart    map-extended
 * @features image-layer
 * @date     2026-09-14
 */

// Magic Numbers

/**
 * The topographic image is wider than the vector map. At the maximum map size
 * (420x420px) it overlaps by these paddings, in px; smaller maps scale them down.
 */
const IMAGE_OVERLAP = { top: 36, right: 49, bottom: 31, left: 42 };
/** Longitude/latitude offset, in degrees, that aligns the image with the map data. */
const GEO_OFFSET = -0.0011;
/** The geographic extent the topographic image covers, as [lon, lat] corner pairs. */
const LAYER_BOUNDS: [[number, number], [number, number]] = [
  [8.431_443 + GEO_OFFSET, 47.448_978 + GEO_OFFSET],
  [8.647_471 + GEO_OFFSET, 47.309_726 + GEO_OFFSET],
];

// Types

type MapData = {
  features: ReturnType<typeof topojson.feature>;
  borders: ReturnType<typeof topojson.mesh>;
  lakeFeatures: ReturnType<typeof topojson.feature>;
  lakeBorders: ReturnType<typeof topojson.mesh>;
};

type State = {
  mapData: MapData | null;
};

type Actions = Record<string, never>;

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("bounds", {
  _: (width: number) => {
    const scale =
      width / (sszvis.aspectRatioSquare.MAX_HEIGHT + IMAGE_OVERLAP.right + IMAGE_OVERLAP.left);

    const padding = {
      top: Math.min(IMAGE_OVERLAP.top * scale, IMAGE_OVERLAP.top),
      right: IMAGE_OVERLAP.right * scale,
      bottom: Math.min(IMAGE_OVERLAP.bottom * scale, IMAGE_OVERLAP.bottom),
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
});

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3.json<Topology>("/preview/_static/topo/stadt-zurich.json").then((topo) => {
      if (topo === undefined) {
        throw new Error("The city topology could not be loaded");
      }
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

    // Layers

    // NOTE: The HTML layer has to come first, so that the topographic image lies under the SVG.
    const htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Stadtkreise mit topografischer Ebene",
      description: "Umrisse der Zürcher Stadtkreise über einem topografischen Kartenbild.",
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

    // NOTE: This example uses a base64-encoded, pre-clipped version of the topographic image.
    const topoLayer = sszvis
      .mapRendererImage()
      .projection(projection)
      .src("topo_layer_280915-test-clipped.png")
      // Expects longitude, latitude
      .geoBounds(LAYER_BOUNDS)
      .opacity(0.8);

    // Rendering

    htmlLayer.call(topoLayer);

    chartLayer.call(choroplethMap);
  },
});
