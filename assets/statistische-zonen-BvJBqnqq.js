var e={ts:{raw:`/**
 * Choropleth map of the statistical zones of the city of Zurich.
 *
 * @sszvis   3.5.1
 * @chart    map-standard
 * @date     2026-09-14
 */

// Magic Numbers

/** Vertical padding in px above and below the map. */
const MAP_PADDING = 30;
const TOPO_URL = "../../_static/topo/stadt-zurich.json";

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
  // together; \`app()\` renders nothing until \`init\` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        geoId: sszvis.parseNumber(d["id"]),
        value: sszvis.parseNumber(d["value"]),
      })),
      d3.json<Topology>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(\`No topology at \${TOPO_URL}\`);
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

    // NOTE: \`.withLake(false)\` hides the textured lake shape and reveals the four
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
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Choropleth map of the statistical zones of the city of Zurich.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    map-standard</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Vertical padding in px above and below the map. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 30</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> TOPO_URL </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">../../_static/topo/stadt-zurich.json</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  geoId</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  value</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MapData </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  features</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> import</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.ExtendedFeatureCollection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  borders</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> import</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.GeoPermissibleObjects</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  data</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  mapData</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MapData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  valueDomain</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Record</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> never</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">aspectRatioSquare</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    return</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    };</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> vAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The chart needs both the values and the geometry, so it loads them</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> together; \`app()\` renders nothing until \`init\` has resolved.</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    Promise</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">all</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        geoId</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">json</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Topology</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">TOPO_URL</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    ]).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">      if</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">topo </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        throw</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> new</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> Error</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">\`</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">No topology at </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">\${</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">TOPO_URL</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">}\`</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">mapData </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        features</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topojson</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">feature</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">objects</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">statistische_zonen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        borders</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topojson</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">mesh</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">objects</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">statistische_zonen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      };</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">valueDomain </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleSeqBlu</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">valueDomain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Statistische Zonen der Stadt Zürich</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Werte je statistische Zone, eingefärbt nach Höhe des Wertes.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: \`.withLake(false)\` hides the textured lake shape and reveals the four</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> lake zones underneath.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> choroplethMap </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">choropleth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">features</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">mapData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">features</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">borders</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">mapData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">borders</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: A feature that matched no datum gets the missing-value texture and</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> never reaches this accessor, so the undefined branch is only here to name</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> the case the signature allows.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ?</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">none</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> :</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> colorScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">strokeWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">widthAdaptiveMapPathStroke</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">defined</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">!==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> &#x26;&#x26;</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> !</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isNaN</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">choroplethMap</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span></code></pre>`},js:{raw:`/**
 * Choropleth map of the statistical zones of the city of Zurich.
 *
 * @sszvis   3.5.1
 * @chart    map-standard
 * @date     2026-09-14
 */

// Magic Numbers

/** Vertical padding in px above and below the map. */
const MAP_PADDING = 30;
const TOPO_URL = "../../_static/topo/stadt-zurich.json";

// Types

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

const vAcc = (d) => d.value;

// Application

sszvis.app({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; \`app()\` renders nothing until \`init\` has resolved.
  init: (state) =>
    Promise.all([
      d3.csv(config.data, (d) => ({
        geoId: sszvis.parseNumber(d["id"]),
        value: sszvis.parseNumber(d["value"]),
      })),
      d3.json(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(\`No topology at \${TOPO_URL}\`);
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

    // NOTE: \`.withLake(false)\` hides the textured lake shape and reveals the four
    // lake zones underneath.
    const choroplethMap = sszvis
      .choropleth()
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
});`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Choropleth map of the statistical zones of the city of Zurich.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    map-standard</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Vertical padding in px above and below the map. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 30</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> TOPO_URL </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">../../_static/topo/stadt-zurich.json</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">aspectRatioSquare</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    return</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> innerHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    };</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> vAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The chart needs both the values and the geometry, so it loads them</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> together; \`app()\` renders nothing until \`init\` has resolved.</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    Promise</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">all</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        geoId</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">json</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">TOPO_URL</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    ]).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">      if</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">topo </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        throw</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> new</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> Error</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">\`</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">No topology at </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">\${</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">TOPO_URL</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">}\`</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">mapData </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        features</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topojson</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">feature</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">objects</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">statistische_zonen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        borders</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topojson</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">mesh</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> topo</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">objects</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">statistische_zonen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      };</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">valueDomain </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleSeqBlu</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">valueDomain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Statistische Zonen der Stadt Zürich</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Werte je statistische Zone, eingefärbt nach Höhe des Wertes.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: \`.withLake(false)\` hides the textured lake shape and reveals the four</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> lake zones underneath.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> choroplethMap </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">choropleth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">features</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">mapData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">features</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">borders</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">mapData</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">borders</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: A feature that matched no datum gets the missing-value texture and</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> never reaches this accessor, so the undefined branch is only here to name</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> the case the signature allows.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ?</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">none</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> :</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> colorScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">strokeWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">widthAdaptiveMapPathStroke</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">defined</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">!==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> &#x26;&#x26;</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> !</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isNaN</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">choroplethMap</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span></code></pre>`},csv:{raw:`id,value
1101,0.1700
1102,0.9522
1103,0.7591
1104,0.55
1201,0.8628
1202,0.5854
1203,0.33655
1204,0.1188
1301,0.4206
1302,0.8794
1303,0.14933
1401,0.80
1402,0.4855
1403,0.5111
1404,0.9682
2101,0.6242
2102,0.08592
2103,0.34977
2104,0.231
2105,0.9331
2106,0.9553
2107,0.5425
2108,0.46080
2109,0.3763
2110,0.3118
2111,0.923
2112,0.6806
2301,0.5266
2302,0.36507
2303,0.29441
2401,0.18790
2402,0.8590
2403,0.9801
2404,0.3104
2405,0.5040
2406,0.1658
2407,0.27364
3101,0.7002
3102,0.4221
3103,0.7256
3104,0.2559
3105,0.44462
3106,0.6745
3301,0.4489
3302,0.19779
3303,0.17668
3304,0.6221
3305,0.17726
3306,0.1933
3401,0.3182
3402,0.9722
3403,0.9267
3404,0.16061
3405,0.8505
3406,0.7330
3407,0.08014
3408,0.1107
4101,0.5386
4102,0.3489`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">value</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1101,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.1700</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1102,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9522</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1103,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.7591</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1104,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.55</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1201,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.8628</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1202,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.5854</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1203,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.33655</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1204,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.1188</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1301,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.4206</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1302,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.8794</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1303,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.14933</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1401,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.80</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1402,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.4855</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1403,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.5111</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1404,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9682</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2101,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.6242</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2102,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.08592</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2103,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.34977</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2104,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.231</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2105,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9331</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2106,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9553</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2107,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.5425</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2108,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.46080</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2109,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.3763</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2110,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.3118</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2111,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.923</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2112,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.6806</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2301,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.5266</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2302,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.36507</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2303,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.29441</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2401,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.18790</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2402,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.8590</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2403,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9801</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2404,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.3104</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2405,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.5040</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2406,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.1658</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">2407,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.27364</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3101,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.7002</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3102,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.4221</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3103,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.7256</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3104,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.2559</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3105,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.44462</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3106,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.6745</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3301,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.4489</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3302,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.19779</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3303,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.17668</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3304,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.6221</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3305,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.17726</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3306,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.1933</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3401,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.3182</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3402,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9722</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3403,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.9267</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3404,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.16061</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3405,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.8505</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3406,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.7330</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3407,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.08014</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">3408,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.1107</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">4101,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.5386</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">4102,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">0.3489</span></span></code></pre>`,lines:218,url:`/sszvis/preview/map-standard/statistische-zonen/data.csv`}};export{e as default};