/**
 * Choropleth map of the Swiss cantons on a diverging colour scale.
 *
 * @category map-standard
 */

// Magic Numbers

const MAX_LEGEND_WIDTH = 320;
/** Cap on the map's inner height in px, so it stays legible on wide screens. */
const MAX_MAP_HEIGHT = 400;
/** Vertical padding in px below the map, which holds the legend. */
const LEGEND_PADDING = 40;
/** Gap in px between the bottom of the map and the legend. */
const LEGEND_GUTTER = 25;
const TOPO_URL = "/preview/_static/topo/switzerland.json";

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

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width) => {
      const innerHeight = Math.min(sszvis.aspectRatio4to3(width), MAX_MAP_HEIGHT);
      return {
        bottom: LEGEND_PADDING,
        height: innerHeight + LEGEND_PADDING,
      };
    },
  })
  .prop("legendWidth", {
    _: (width) => Math.min(width / 2, MAX_LEGEND_WIDTH),
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
        geoId: sszvis.parseNumber(d["KantonNr"] ?? ""),
        value: sszvis.parseNumber(d["Wert"] ?? ""),
      })),
      d3.json<{ objects: Record<string, unknown> }>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["cantons"]),
        borders: topojson.mesh(topo, topo.objects["cantons"]),
      };
      state.valueDomain = [0, d3.max(data, vAcc) ?? 0];
    }),

  render(state) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    const colorScale = sszvis.scaleDivNtrGry().domain(state.valueDomain);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Geschlechterverhältnis nach Kanton",
        description: "Anteil Frauen und Männer je Kanton, auf einer divergierenden Farbskala.",
      })
      .datum(state.data);

    // Components

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
      .defined((d) => d !== undefined && !Number.isNaN(vAcc(d)));

    const legend = sszvis
      .legendColorLinear<string>()
      .scale(colorScale)
      .width(props.legendWidth)
      .labelText(["Frauen", "Männer"]);

    // Rendering

    chartLayer
      .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
      .call(choroplethMap);

    chartLayer
      .selectGroup("legend")
      .attr(
        "transform",
        sszvis.translateString(
          bounds.width / 2 - props.legendWidth / 2,
          bounds.innerHeight + LEGEND_GUTTER,
        ),
      )
      .call(legend);
  },
});
