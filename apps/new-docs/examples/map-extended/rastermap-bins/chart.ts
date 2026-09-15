/**
 * Raster map of Zurich where each 50m cell is shaded by a binned colour scale.
 *
 * @category map-extended
 */

// Magic Numbers

const MAX_LEGEND_WIDTH = 320;
const MIN_CONTROL_WIDTH = 200;
/** Height reserved above the map for the button group, in px. */
const CONTROL_SPACE = 74;
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
/** How many colour bins the values are grouped into. */
const NUM_BINS = 5;

// Types

/** The TopoJSON topology as the examples read it: only its `objects` member is used. */
type Topology = { objects: Record<string, unknown> };

type MapData = {
  features: ReturnType<typeof topojson.feature>;
  borders: ReturnType<typeof topojson.mesh>;
  lakeFeatures: ReturnType<typeof topojson.feature>;
  lakeBorders: ReturnType<typeof topojson.mesh>;
};

type Key = "Kinder" | "Random";

type Datum = {
  xpos: number;
  ypos: number;
  kinder: number;
  random: number;
};

type State = {
  data: Datum[];
  mapData: MapData | null;
  valueDomain: [number, number];
  currentKey: Key;
};

type Actions = {
  setKey: (state: State, e: Event, key: Key) => void;
};

const KEY_OPTIONS: Key[] = ["Kinder", "Random"];

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width: number) => {
      const scale =
        width / (sszvis.aspectRatioSquare.MAX_HEIGHT + IMAGE_OVERLAP.right + IMAGE_OVERLAP.left);

      const padding = {
        top: CONTROL_SPACE + Math.min(IMAGE_OVERLAP.top * scale, IMAGE_OVERLAP.top),
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
  })
  .prop("controlWidth", {
    _: (width: number) => Math.max(MIN_CONTROL_WIDTH, Math.min(MAX_LEGEND_WIDTH, width / 2)),
  });

// Accessors

const xAcc = (d: Datum) => d.xpos;
const yAcc = (d: Datum) => d.ypos;
const kinderAcc = (d: Datum) => d.kinder;
const randomAcc = (d: Datum) => d.random;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        xpos: sszvis.parseNumber(d["xkoord"]),
        ypos: sszvis.parseNumber(d["ykoord"]),
        kinder: sszvis.parseNumber(d["kinder"]),
        random: sszvis.parseNumber(d["random"]),
      })),
      d3.json<Topology>("/preview/_static/topo/stadt-zurich.json"),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error("The city topology could not be loaded");
      }
      state.data = data;
      // NOTE: Both series share the colour scale of the real data, so the random series is
      // shown on the same footing rather than rescaling the legend under the reader.
      state.valueDomain = [d3.min(data, kinderAcc) ?? 0, d3.max(data, kinderAcc) ?? 0];
      state.currentKey = "Kinder";
      state.mapData = {
        features: topojson.feature(topo, topo.objects["stadtkreise"]),
        borders: topojson.mesh(topo, topo.objects["stadtkreise"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["stadtkreis_lakebounds"]),
      };
    }),

  actions: {
    setKey(state, _e, key) {
      state.currentKey = key;
    },
  },

  render(state, actions) {
    if (state.mapData === null) {
      return;
    }

    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);
    const vAcc = state.currentKey === "Kinder" ? kinderAcc : randomAcc;

    // Scales

    // NOTE: d3.scaleThreshold takes the inner bin edges only - the ends of the domain are
    // implicit - so the range holds one colour more than the domain holds edges. The binned
    // heat table example walks through the same construction in more detail.
    const binStep =
      Math.ceil(((state.valueDomain[1] - state.valueDomain[0]) / NUM_BINS) * 100) / 100;
    const binEdges = d3.range(
      state.valueDomain[0] + binStep,
      state.valueDomain[0] + binStep * NUM_BINS,
      binStep,
    );
    // The colours are read off a continuous scale at the integer positions [0, NUM_BINS - 1].
    const interpolateColor = sszvis
      .scaleDivValGry()
      .reverse()
      .domain([0, NUM_BINS - 1]);
    const binColors = d3.range(0, NUM_BINS).map(interpolateColor);

    const colorScale = d3
      .scaleThreshold<number, import("d3").LabColor>()
      .domain(binEdges)
      .range(binColors);

    // Layers

    // NOTE: The keys keep the three layers apart and in a stable stacking order: the
    // topographic image and the raster canvas at the bottom, the city outline in the SVG
    // above them, and the button group on top.
    const htmlUnderLayer = sszvis
      .createHtmlLayer(config.id, bounds, { key: "underlayer" })
      .datum(state.data);

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Kinder in der Stadt Zürich",
      description: "Anzahl Kinder je Rasterzelle von 50 auf 50 Metern, in fünf Klassen.",
    });

    const htmlOverLayer = sszvis.createHtmlLayer(config.id, bounds, { key: "overlayer" });

    // Components

    const control = sszvis
      .buttonGroup<Key>()
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
      // This map is drawn for its outline over the raster below it, not to paint values, so its
      // entities are never missing anything and must not be textured.
      .encodesData(false)
      .fill("none")
      .borderColor("#fff");

    const projection = sszvis.swissMapProjection(
      bounds.innerWidth,
      bounds.innerHeight,
      state.mapData.features,
      "zurichStadtfeatures",
    );

    // NOTE: A distance in meters has no fixed pixel size, so the cell side is measured from the
    // projection at the centre of the raster - the same square is larger at the equator. Snapping
    // it to a half pixel reduces the grid-like overlap patterning of the exact measurement.
    const pixelSide = sszvis.halfPixel(
      sszvis.pixelsFromGeoDistance(
        projection,
        [
          (LAYER_BOUNDS[0][0] + LAYER_BOUNDS[1][0]) / 2,
          (LAYER_BOUNDS[0][1] + LAYER_BOUNDS[1][1]) / 2,
        ],
        CELL_SIDE_METERS,
      ),
    );

    const rasterLayer = sszvis
      .mapRendererRaster<Datum>()
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .position((d) => projection(cellCenter(d)))
      .cellSide(pixelSide)
      .fill((d) => colorScale(vAcc(d)))
      .opacity(0.6);

    const topoLayer = sszvis
      .mapRendererImage()
      .projection(projection)
      .src("/preview/_static/topo_layer_280915.png")
      // Expects longitude, latitude
      .geoBounds(LAYER_BOUNDS)
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
          bounds.innerHeight + bounds.padding.bottom - 40,
        ),
      )
      .call(legend);

    htmlOverLayer
      .selectDiv("controls")
      .style("left", (bounds.innerWidth - props.controlWidth) / 2 + "px")
      .style("top", 20 - bounds.padding.top + "px")
      .call(control);
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
