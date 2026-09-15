/**
 * Choropleth map of the statistical zones of the city of Zurich.
 *
 * @category map-standard
 */

// Magic Numbers

/** Vertical padding in px above and below the map. */
const MAP_PADDING = 30;
const TOPO_URL = "/preview/_static/topo/stadt-zurich.json";

// Types

type Datum = {
  geoId: number;
  value: number;
};

type MapData = {
  features: import("d3").ExtendedFeatureCollection;
  borders: import("d3").GeoPermissibleObjects;
};

type State = {
  data: Datum[];
  mapData: MapData;
  valueDomain: [number, number];
};

type Actions = Record<string, never>;

// Responsive Props

const queryProps = sszvis.responsiveProps().prop("bounds", {
  _: (width) => {
    const innerHeight = sszvis.aspectRatioSquare(width);
    return {
      top: MAP_PADDING,
      bottom: MAP_PADDING,
      height: MAP_PADDING + innerHeight + MAP_PADDING,
    };
  },
});

// Accessors

const vAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; `app()` renders nothing until `init` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        geoId: sszvis.parseNumber(d["id"]),
        value: sszvis.parseNumber(d["value"]),
      })),
      d3.json<{ objects: Record<string, unknown> }>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["statistische_zonen"]),
        borders: topojson.mesh(topo, topo.objects["statistische_zonen"]),
      };
      state.valueDomain = [0, d3.max(data, vAcc) ?? 0];
    }),

  render(state) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    const colorScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Statistische Zonen der Stadt Zürich",
        description: "Werte je statistische Zone, eingefärbt nach Höhe des Wertes.",
      })
      .datum(state.data);

    // Components

    // NOTE: `.withLake(false)` hides the textured lake shape and reveals the four
    // lake zones underneath.
    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      // NOTE: A feature that matched no datum gets the missing-value texture and
      // never reaches this accessor, so the undefined branch is only here to name
      // the case the signature allows.
      .fill((d) => (d === undefined ? "none" : colorScale(vAcc(d))))
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
      .defined((d) => d !== undefined && !Number.isNaN(vAcc(d)));

    // Rendering

    chartLayer.call(choroplethMap);
  },
});
