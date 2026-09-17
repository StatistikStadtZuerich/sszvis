/**
 * __TITLE__
 *
 * @generator sszvis-chart-builder
 * @sszvis    __SSZVIS_VERSION__
 * @chart     __CHART__
 * @features  __FEATURES__
 * @date      __DATE__
 */

// Magic Numbers

/** The page names the geometry file; in the exported bundle it sits beside the chart. */
const TOPO_URL = config.topology ?? __TOPO_PATH__;
const MAX_LEGEND_WIDTH = 320;
/** Vertical padding in px above the map, and below it where the legend sits. */
const TOP_PADDING = 30;
const BOTTOM_PADDING = __BOTTOM_PADDING__;
// {{block:magicNumbers}}

// Types

type Datum = {
  /** The area's id in the geometry. A string, because that is how the two are matched. */
  code: string;
  label: string;
  value: number;
};

/**
 * What the map binds to each area and to each tooltip anchor: the feature paired
 * with the datum matched to it. The pairing is what lets the tooltip be positioned
 * from the geometry, and it is why reading a value means going through `.datum`
 * rather than treating the bound object as the datum itself.
 */
type MapDatum = import("sszvis").MergedGeoDatum<Datum>;

type MapData = {
  features: import("d3").ExtendedFeatureCollection;
  borders: import("d3").GeoPermissibleObjects;
  // {{block:mapDataTypes}}
};

type State = {
  data: Datum[];
  mapData: MapData;
  valueDomain: [number, number];
  // {{block:stateTypes}}
};

type Actions = __ACTIONS_TYPE__;

// {{block:types}}

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    _: (width) => {
      const innerHeight = sszvis.aspectRatioSquare(width);
      return {
        top: TOP_PADDING,
        bottom: BOTTOM_PADDING,
        height: TOP_PADDING + innerHeight + BOTTOM_PADDING,
      };
    },
  })
  .prop("legendWidth", { _: (width) => Math.min(width / 2, MAX_LEGEND_WIDTH) });

// Accessors

/**
 * The code an area is matched on. The geometry numbers its areas plainly, so a
 * zero-padded "091" in the data has to be read as 91 to find the one it means;
 * a code that is not a number at all (a Wahlkreis is called "1 + 2") is left alone.
 */
const areaCode = (value: string) => {
  const trimmed = value.trim();
  const asNumber = Number(trimmed);
  return trimmed !== "" && !Number.isNaN(asNumber) ? String(asNumber) : trimmed;
};

// NOTE: These take what the map binds, not a row, and an area that matched no row
// binds `undefined`. Reading through that here keeps every caller below simple.
const vAcc = (d: MapDatum) => (d.datum === undefined ? Number.NaN : d.datum.value);
const labelAcc = (d: MapDatum) => (d.datum === undefined ? "" : d.datum.label);
const codeAcc = (d: MapDatum) => (d.datum === undefined ? "" : d.datum.code);

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; `app()` renders nothing until `init` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        code: areaCode(d[__GEO_FIELD__] ?? ""),
        label: __LABEL_EXPR__,
        value: sszvis.parseNumber(d[__VALUE_FIELD__]),
      })),
      d3.json<Topology>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects[__LAYER__]),
        borders: topojson.mesh(topo, topo.objects[__LAYER__]),
        // {{block:mapData}}
      };
      state.valueDomain = [0, d3.max(data, (d) => d.value) ?? 0];
      // {{block:init}}
    }),

  // {{block:actions}}
  render(state, __ACTIONS_PARAM__) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // Scales

    const colorScale = __COLOR_SCALE__;

    // {{block:scales}}

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: __TITLE_TEXT__,
        description: __DESCRIPTION__,
      })
      .datum(state.data);

    // {{block:layers}}

    // Components

    // {{block:overlays}}

    // NOTE: An area that matched no row, or whose value is not a number, is drawn
    // with the missing-value texture and never reaches the fill accessor.
    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      // {{block:mapProps}}
      .keyName("code")
      .width(bounds.innerWidth)
      .height(bounds.innerHeight)
      .strokeWidth(sszvis.widthAdaptiveMapPathStroke(bounds.width))
      .defined((d) => d !== undefined && !Number.isNaN(d.value))
      .fill(__MAP_FILL__);

    // {{block:components}}

    // Rendering

    chartLayer
      .attr("transform", sszvis.translateString(bounds.padding.left, bounds.padding.top))
      .call(choroplethMap);

    // {{block:render}}

    // {{block:interaction}}
  },
});

// {{block:helpers}}
