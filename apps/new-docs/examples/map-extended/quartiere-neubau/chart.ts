/**
 * Map of the statistical quarters of Zurich with new housing developments drawn on top.
 *
 * @category map-extended
 */

// Magic Numbers

/** Vertical padding above and below the map, in px. */
const VERTICAL_PADDING = 30;

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
  _: (width: number) => ({
    top: VERTICAL_PADDING,
    bottom: VERTICAL_PADDING,
    height: VERTICAL_PADDING + sszvis.aspectRatioSquare(width) + VERTICAL_PADDING,
  }),
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
      d3.json<ReturnType<typeof topojson.feature>>("neubausiedlungen.json"),
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

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Neubausiedlungen in der Stadt Zürich",
        description: "Neubausiedlungen nach Bezugsjahr, über den statistischen Quartieren.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const mapMaker = sszvis
      .choropleth()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .lakeBorders(state.mapData.lakeBorders)
      .lakePathColor("#7C7C7C")
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .fill("none")
      .borderColor("#7C7C7C");

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

    chartLayer.call(mapMaker);

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
