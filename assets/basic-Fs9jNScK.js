var e={ts:{raw:`/**
 * Basic pie chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    pie-charts
 * @features tooltip, legend
 * @date     2026-09-14
 */

// Magic Numbers

/** Outer diameter of the pie in px, used on wide screens. */
const PIE_DIAMETER = 260;
const LEGEND_TOP_PADDING = 40;
const LEGEND_LEFT_PADDING = 25;
const LEGEND_HEIGHT = 145;
const LEGEND_WIDTH = 102;

// Types

type Layout = {
  bounds: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    height: number;
  };
  pieRadius: number;
  piePosition: { top: number; left: number };
  legendPosition: { top: number; left: number };
};

type Datum = {
  category: string;
  value: number;
};

type State = {
  data: Datum[];
  totalValue: number;
  categories: string[];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, datum: Datum) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

// NOTE: On narrow screens the legend moves below the pie, so the pie shrinks to
// the available width and the bounds grow to make room for the legend.
const palmLayout = (width: number): Layout => {
  const sidePadding = Math.max((width - PIE_DIAMETER) / 2, 10);
  const diameter = width - 2 * sidePadding;
  const legendHeight = LEGEND_TOP_PADDING + LEGEND_HEIGHT + 20;
  return {
    bounds: {
      top: 20,
      bottom: legendHeight,
      left: sidePadding,
      right: sidePadding,
      height: 20 + diameter + legendHeight,
    },
    pieRadius: diameter / 2,
    piePosition: { top: 0, left: sidePadding },
    legendPosition: { top: diameter + LEGEND_TOP_PADDING, left: 0 },
  };
};

const wideLayout = (width: number): Layout => ({
  bounds: {
    top: 20,
    bottom: 20,
    left: 20,
    right: LEGEND_WIDTH,
    height: 20 + 20 + PIE_DIAMETER,
  },
  pieRadius: PIE_DIAMETER / 2,
  piePosition: {
    top: 0,
    left: width / 2 - (PIE_DIAMETER + LEGEND_LEFT_PADDING + LEGEND_WIDTH) / 2,
  },
  legendPosition: {
    top: PIE_DIAMETER / 2 - LEGEND_HEIGHT / 2,
    left: PIE_DIAMETER + LEGEND_LEFT_PADDING,
  },
});

const queryProps = sszvis.responsiveProps().prop("layout", {
  palm: palmLayout,
  _: wideLayout,
});

// Accessors

const vAcc = (d: Datum) => d.value;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Kategorie"] ?? "",
        value: sszvis.parseNumber(d["Schweiz Import"]),
      }))
      .then((data) => {
        state.data = data;
        state.totalValue = d3.sum(data, vAcc);
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, datum) {
      state.selection = [datum];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const layout: Layout = props.layout;
    const bounds = sszvis.bounds(layout.bounds, config.id);

    // Scales

    const aScale = d3
      .scaleLinear()
      .domain([0, state.totalValue])
      .range([0, 2 * Math.PI]);

    const cScale = sszvis.scaleQual12().domain(state.categories);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Importe der Schweiz nach Kategorie",
        description: "Anteil der Warenkategorien an den gesamten Importen der Schweiz",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const pieMaker = sszvis
      .pie<Datum>()
      .radius(layout.pieRadius)
      .angle((d) => aScale(vAcc(d)))
      .fill((d) => cScale(cAcc(d)));

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .rows(state.categories.length)
      .orientation("vertical");

    const headerText = sszvis
      .modularTextHTML()
      .bold((d: Datum) => sszvis.formatFractionPercent(vAcc(d) / state.totalValue));

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header(headerText)
      .visible((d) => sszvis.contains(state.selection, d));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(layout.piePosition.left, layout.piePosition.top),
    );

    const pie = chartLayer.selectGroup("piechart").call(pieMaker);

    pie.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(layout.legendPosition.left, layout.legendPosition.top),
      )
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .panning<Datum>()
      .elementSelector(".sszvis-path")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    pie.call(interactionLayer);
  },
});
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Basic pie chart example using sszvis.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    pie-charts</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip, legend</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Outer diameter of the pie in px, used on wide screens. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 260</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_TOP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 40</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_LEFT_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 25</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_HEIGHT </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 145</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_WIDTH </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 102</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Layout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  bounds</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bottom</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    right</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    height</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  };</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  pieRadius</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  piePosition</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  legendPosition</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  category</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  value</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  data</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  totalValue</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  categories</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  selection</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  showTooltip</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> e</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Event</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> datum</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  hideTooltip</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: On narrow screens the legend moves below the pie, so the pie shrinks to</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> the available width and the bounds grow to make room for the legend.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> palmLayout</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Layout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 10</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> width </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">*</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_TOP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_HEIGHT </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  return</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    pieRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_TOP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  };</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> wideLayout</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Layout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_WIDTH</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  pieRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> width </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_LEFT_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_WIDTH</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_HEIGHT </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_LEFT_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  palm</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> palmLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> wideLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> vAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Kategorie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Schweiz Import</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">set</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> layout</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Layout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> aScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">*</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">PI</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleQual12</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Importe der Schweiz nach Kategorie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Anteil der Warenkategorien an den gesamten Importen der Schweiz</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> pieMaker </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">pie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">radius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pieRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">angle</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> aScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorLegend </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">legendColorOrdinal</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">rows</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">length</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">vertical</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> headerText </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatFractionPercent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">headerText</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> pie </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">piechart</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pieMaker</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    pie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      )</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">panning</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">elementSelector</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.sszvis-path</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">start</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pan</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    pie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span></code></pre>`},js:{raw:`/**
 * Basic pie chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    pie-charts
 * @features tooltip, legend
 * @date     2026-09-14
 */

// Magic Numbers

/** Outer diameter of the pie in px, used on wide screens. */
const PIE_DIAMETER = 260;
const LEGEND_TOP_PADDING = 40;
const LEGEND_LEFT_PADDING = 25;
const LEGEND_HEIGHT = 145;
const LEGEND_WIDTH = 102;

// Types

// Responsive Props

// NOTE: On narrow screens the legend moves below the pie, so the pie shrinks to
// the available width and the bounds grow to make room for the legend.
const palmLayout = (width) => {
  const sidePadding = Math.max((width - PIE_DIAMETER) / 2, 10);
  const diameter = width - 2 * sidePadding;
  const legendHeight = LEGEND_TOP_PADDING + LEGEND_HEIGHT + 20;
  return {
    bounds: {
      top: 20,
      bottom: legendHeight,
      left: sidePadding,
      right: sidePadding,
      height: 20 + diameter + legendHeight,
    },
    pieRadius: diameter / 2,
    piePosition: { top: 0, left: sidePadding },
    legendPosition: { top: diameter + LEGEND_TOP_PADDING, left: 0 },
  };
};

const wideLayout = (width) => ({
  bounds: {
    top: 20,
    bottom: 20,
    left: 20,
    right: LEGEND_WIDTH,
    height: 20 + 20 + PIE_DIAMETER,
  },
  pieRadius: PIE_DIAMETER / 2,
  piePosition: {
    top: 0,
    left: width / 2 - (PIE_DIAMETER + LEGEND_LEFT_PADDING + LEGEND_WIDTH) / 2,
  },
  legendPosition: {
    top: PIE_DIAMETER / 2 - LEGEND_HEIGHT / 2,
    left: PIE_DIAMETER + LEGEND_LEFT_PADDING,
  },
});

const queryProps = sszvis.responsiveProps().prop("layout", {
  palm: palmLayout,
  _: wideLayout,
});

// Accessors

const vAcc = (d) => d.value;
const cAcc = (d) => d.category;

// Application

sszvis.app({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Kategorie"] ?? "",
        value: sszvis.parseNumber(d["Schweiz Import"]),
      }))
      .then((data) => {
        state.data = data;
        state.totalValue = d3.sum(data, vAcc);
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, datum) {
      state.selection = [datum];
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const layout = props.layout;
    const bounds = sszvis.bounds(layout.bounds, config.id);

    // Scales

    const aScale = d3
      .scaleLinear()
      .domain([0, state.totalValue])
      .range([0, 2 * Math.PI]);

    const cScale = sszvis.scaleQual12().domain(state.categories);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Importe der Schweiz nach Kategorie",
        description: "Anteil der Warenkategorien an den gesamten Importen der Schweiz",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const pieMaker = sszvis
      .pie()
      .radius(layout.pieRadius)
      .angle((d) => aScale(vAcc(d)))
      .fill((d) => cScale(cAcc(d)));

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .rows(state.categories.length)
      .orientation("vertical");

    const headerText = sszvis
      .modularTextHTML()
      .bold((d) => sszvis.formatFractionPercent(vAcc(d) / state.totalValue));

    const tooltip = sszvis
      .tooltip()
      .renderInto(tooltipLayer)
      .header(headerText)
      .visible((d) => sszvis.contains(state.selection, d));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(layout.piePosition.left, layout.piePosition.top),
    );

    const pie = chartLayer.selectGroup("piechart").call(pieMaker);

    pie.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr(
        "transform",
        sszvis.translateString(layout.legendPosition.left, layout.legendPosition.top),
      )
      .call(colorLegend);

    // Interaction

    const interactionLayer = sszvis
      .panning()
      .elementSelector(".sszvis-path")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    pie.call(interactionLayer);
  },
});`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Basic pie chart example using sszvis.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    pie-charts</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip, legend</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Outer diameter of the pie in px, used on wide screens. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 260</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_TOP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 40</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_LEFT_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 25</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_HEIGHT </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 145</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_WIDTH </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 102</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: On narrow screens the legend moves below the pie, so the pie shrinks to</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> the available width and the bounds grow to make room for the legend.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> palmLayout</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 10</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> width </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">*</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_TOP_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_HEIGHT </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  return</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> legendHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    pieRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sidePadding </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> diameter </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_TOP_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  };</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> wideLayout</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_WIDTH</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 20 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  pieRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> width </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_LEFT_PADDING </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_WIDTH</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_HEIGHT </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> PIE_DIAMETER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> LEGEND_LEFT_PADDING</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  palm</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> palmLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> wideLayout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> vAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Kategorie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Schweiz Import</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">sum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">set</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> layout </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> aScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">*</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">PI</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleQual12</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Importe der Schweiz nach Kategorie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Anteil der Warenkategorien an den gesamten Importen der Schweiz</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> pieMaker </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">pie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">radius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pieRadius</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">angle</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> aScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> colorLegend </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">legendColorOrdinal</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">rows</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">length</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">vertical</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> headerText </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatFractionPercent</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">vAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> /</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">headerText</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">piePosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> pie </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">piechart</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pieMaker</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    pie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">        "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> layout</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">legendPosition</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      )</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">colorLegend</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">panning</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">elementSelector</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">.sszvis-path</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">start</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">pan</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    pie</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span></code></pre>`},csv:{raw:`Kategorie,Schweiz Import
Landwirtschaftliche Produkte,13305
Energieträger,17448
"Textilien, Bekleidung",8718
Papier und Papierwaren,4337
"Leder, Kautschuk, Kunststoffe",6193
Chemikalien,39368
Steine und Erden,2895
Metalle,13812
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Kategorie,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Schweiz Import</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Landwirtschaftliche Produkte,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">13305</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Energieträger,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">17448</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">"Textilien, Bekleidung",</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">8718</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Papier und Papierwaren,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">4337</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">"Leder, Kautschuk, Kunststoffe",</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">6193</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Chemikalien,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">39368</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Steine und Erden,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">2895</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Metalle,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">13812</span></span>
<span class="line"></span></code></pre>`}};export{e as default};