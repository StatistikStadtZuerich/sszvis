/**
 * Map of the statistical quarters of Zurich, with subsidised housing developments drawn
 * over a topographic image layer.
 *
 * @sszvis   3.5.1
 * @chart    map-extended
 * @features tooltip, image-layer, geojson-overlay
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

type Datum = {
  id: number;
  name: string;
  ownership: string;
  year: number;
};

/** What the GeoJSON renderer binds to each shape: a feature paired with its datum, if any. */
type AnchorDatum = { datum: Datum | undefined };

type State = {
  data: Datum[];
  mapData: MapData | null;
  developments: ReturnType<typeof topojson.feature> | null;
  selection: Datum[];
  yearRange: [number, number];
};

type Actions = {
  selectHovered: (state: State, datum: Datum | undefined) => void;
  deselectHovered: (state: State) => void;
};

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

// Accessors

const nameAcc = (d: Datum) => d.name;
const yearAcc = (d: Datum) => d.year;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        id: sszvis.parseNumber(d["id"]),
        name: d["name"] ?? "",
        ownership: d["traegerschaft"] ?? "",
        // NOTE: A missing year is recorded as 0 in the data; it reads as "no value" here, so
        // that the development is drawn without a colour rather than as the oldest one.
        year: parseYear(d["bezugsjahr"]),
      })),
      d3.json<Topology>("/preview/_static/topo/stadt-zurich.json"),
      d3.json<ReturnType<typeof topojson.feature>>("gemeinnuetzige.json"),
    ]).then(([data, topo, developments]) => {
      if (topo === undefined || developments === undefined) {
        throw new Error("The map data could not be loaded");
      }
      state.data = data;
      state.yearRange = [d3.min(data, yearAcc) ?? 0, d3.max(data, yearAcc) ?? 0];
      state.selection = [];
      state.developments = developments;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["statistische_quartiere"]),
        borders: topojson.mesh(topo, topo.objects["statistische_quartiere"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["statistische_quartiere_lakebounds"]),
      };
    }),

  actions: {
    selectHovered(state, datum) {
      state.selection = datum === undefined ? [] : [datum];
    },

    deselectHovered(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    if (state.mapData === null || state.developments === null) {
      return;
    }

    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    const colorScale = sszvis.scaleSeqBlu().reverse().domain(state.yearRange);

    // Layers

    // NOTE: The HTML layer has to come first, so that the topographic image lies under the SVG.
    const htmlLayer = sszvis.createHtmlLayer(config.id, bounds, { key: "topolayer" });

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Gemeinnützige Siedlungen in der Stadt Zürich",
        description:
          "Gemeinnützige Siedlungen nach Bezugsjahr, über einem topografischen Kartenbild.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis
      .createHtmlLayer(config.id, bounds, { key: "tooltiplayer" })
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
      "zurichStadtfeatures",
    );

    const newBuildings = sszvis
      .mapRendererGeoJson<Datum>()
      .dataKeyName("id")
      .geoJsonKeyName("OBJECTID")
      .geoJson(state.developments)
      .mapPath(mapPath)
      .defined((d: Datum) => sszvis.defined(yearAcc(d)))
      .fill((d: Datum) => colorScale(yearAcc(d)))
      .stroke((d: Datum) => colorScale(yearAcc(d)))
      .strokeWidth(1.25)
      .on("over", actions.selectHovered)
      .on("click", actions.selectHovered)
      .on("out", actions.deselectHovered);

    const topoLayer = sszvis
      .mapRendererImage()
      .projection(
        sszvis.swissMapProjection(
          bounds.innerWidth,
          bounds.innerHeight,
          state.mapData.features,
          "zurichStadtfeatures",
        ),
      )
      .src("/preview/_static/topo_layer_280915.png")
      // Expects longitude, latitude
      .geoBounds(LAYER_BOUNDS)
      .opacity(0.4);

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: AnchorDatum) => (d.datum === undefined ? "" : nameAcc(d.datum)));

    const tooltip = sszvis
      .tooltip<AnchorDatum>()
      .renderInto(tooltipLayer)
      .header(tooltipHeader)
      .body((d) => (d.datum === undefined ? "" : String(yearAcc(d.datum))))
      .visible((d) => d.datum !== undefined && sszvis.contains(state.selection, d.datum));

    // Rendering

    htmlLayer.call(topoLayer);

    chartLayer.call(choroplethMap);

    chartLayer.call(newBuildings);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);
  },
});

// Helper functions

/** A bezugsjahr of 0 stands for "not known", which is NaN here so that it reads as missing. */
const parseYear = (value: string) => {
  const year = sszvis.parseNumber(value);
  return year === 0 ? Number.NaN : year;
};
