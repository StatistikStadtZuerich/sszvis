var e={ts:{raw:`/**
 * Basic horizontal bar chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-horizontal
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** In the x scale's own domain units - employees - not pixels. */
const BAR_TOUCH_THRESHOLD = 1000;
const SERIES_KEY = "Zupendler";

// Types

type Datum = {
  category: string;
  xValue: number;
};

type State = {
  data: Datum[];
  categories: string[];
  selection: Datum[];
};

type Actions = {
  showTooltip: (state: State, e: Event, xValue: number | null, category: string | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: "Beschäftigte" })
  .prop("ticks", { palm: 4, _: 5 });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        xValue: sszvis.parseNumber(d["Zupendler"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, _xValue, category) {
      state.selection = state.data.filter((d) => cAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  // Render
  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
    const bounds = sszvis.bounds(
      {
        height: 30 + chartDimensions.totalHeight + 40,
        top: 30,
        bottom: 40,
      },
      config.id,
    );
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    const widthScale = d3
      .scaleLinear()
      .range([0, chartWidth])
      .domain([0, d3.max(state.data, xAcc) ?? 0]);

    const yScale = d3
      .scaleBand<string>()
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .rangeRound([0, chartDimensions.totalHeight])
      .domain(state.categories);

    // NOTE: One series, so one colour: the categories are already named on the y axis
    const barFill = sszvis.scaleQual12()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Zupendler nach Sektor",
      description: "Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor.",
    });
    chartLayer.datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      .x(0)
      .y((d) => yScale(cAcc(d)) ?? 0)
      .width((d) => widthScale(xAcc(d)))
      .height(chartDimensions.barHeight)
      .centerTooltip(true)
      .fill(barFill);

    const xAxis = sszvis
      .axisX()
      .scale(widthScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(props.ticks)
      .title(props.xLabel);

    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: Datum) => {
        const value = xAcc(d);
        return Number.isNaN(value) ? "k. A." : sszvis.formatNumber(value);
      })
      .plain(props.xLabel);

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .visible((d) => sszvis.contains(state.selection, d));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    const bars = chartLayer.selectGroup("bars").call(barGen);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
      .call(yAxis);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    const interactionLayer = sszvis
      .move<number, string>()
      .xScale(widthScale)
      .yScale(yScale)
      .cancelScrolling(isWithinBarContour(state))
      .fireOnPanOnly(true)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/**
 * On touch devices, scrolling is cancelled while the cursor is over a bar, so
 * that a pan gesture reads as a tooltip query. Bars that are very short, or
 * that have no value at all, are still reachable within
 * \`BAR_TOUCH_THRESHOLD\` of the zero line.
 */
const isWithinBarContour = (state: State) => (xValue: number | null, category: string | null) => {
  if (xValue == null || category == null) {
    return false;
  }
  const barDatum = state.data.find((d) => cAcc(d) === category);
  if (barDatum === undefined) {
    return false;
  }
  return Number.isNaN(xAcc(barDatum))
    ? xValue < BAR_TOUCH_THRESHOLD
    : xValue < Math.max(xAcc(barDatum), BAR_TOUCH_THRESHOLD);
};
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Basic horizontal bar chart example using sszvis.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    bar-chart-horizontal</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAX_WIDTH </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 800</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> In the x scale's own domain units - employees - not pixels. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> BAR_TOUCH_THRESHOLD </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 1000</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> SERIES_KEY </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zupendler</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  category</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  xValue</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  data</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  categories</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  selection</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  showTooltip</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> e</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Event</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xValue</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">|</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">|</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  hideTooltip</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Beschäftigte</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> palm</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 4</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 5 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
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
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Sektor</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zupendler</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">set</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">filter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Render</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">dimensionsHorizontalBarChart</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">length</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 30 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 40</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 30</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 40</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">min</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAX_WIDTH</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> widthScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleBand</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padRatio</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">paddingOuter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">outerRatio</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">rangeRound</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: One series, so one colour: the categories are already named on the y axis</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFill </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleQual12</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zupendler nach Sektor</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    });</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barGen </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bar</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">x</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">y</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> widthScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">centerTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barFill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">axisX</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">widthScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">alignOuterLabels</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">axisY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ordinal</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipHeader </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> value </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        return</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isNaN</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ?</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">k. A.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">plain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fitTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipHeader</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bars </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barGen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">axisOffset</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">widthScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">cancelScrolling</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isWithinBarContour</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fireOnPanOnly</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interaction</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Helper functions</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * On touch devices, scrolling is cancelled while the cursor is over a bar, so</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * that a pan gesture reads as a tooltip query. Bars that are very short, or</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * that have no value at all, are still reachable within</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * \`BAR_TOUCH_THRESHOLD\` of the zero line.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> isWithinBarContour</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xValue</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">|</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">|</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  if</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ||</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    return</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> false</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  }</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barDatum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">find</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  if</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barDatum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    return</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> false</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  }</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  return</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isNaN</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    ?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> BAR_TOUCH_THRESHOLD</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> BAR_TOUCH_THRESHOLD</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span></code></pre>`},js:{raw:`/**
 * Basic horizontal bar chart example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-horizontal
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** In the x scale's own domain units - employees - not pixels. */
const BAR_TOUCH_THRESHOLD = 1000;
const SERIES_KEY = "Zupendler";

// Types

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: "Beschäftigte" })
  .prop("ticks", { palm: 4, _: 5 });

// Accessors

const xAcc = (d) => d.xValue;
const cAcc = (d) => d.category;

// Application

sszvis.app({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        xValue: sszvis.parseNumber(d["Zupendler"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, _xValue, category) {
      state.selection = state.data.filter((d) => cAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  // Render
  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const chartDimensions = sszvis.dimensionsHorizontalBarChart(state.categories.length);
    const bounds = sszvis.bounds(
      {
        height: 30 + chartDimensions.totalHeight + 40,
        top: 30,
        bottom: 40,
      },
      config.id,
    );
    const chartWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    const widthScale = d3
      .scaleLinear()
      .range([0, chartWidth])
      .domain([0, d3.max(state.data, xAcc) ?? 0]);

    const yScale = d3
      .scaleBand()
      .padding(chartDimensions.padRatio)
      .paddingOuter(chartDimensions.outerRatio)
      .rangeRound([0, chartDimensions.totalHeight])
      .domain(state.categories);

    // NOTE: One series, so one colour: the categories are already named on the y axis
    const barFill = sszvis.scaleQual12()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Zupendler nach Sektor",
      description: "Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor.",
    });
    chartLayer.datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar()
      .x(0)
      .y((d) => yScale(cAcc(d)) ?? 0)
      .width((d) => widthScale(xAcc(d)))
      .height(chartDimensions.barHeight)
      .centerTooltip(true)
      .fill(barFill);

    const xAxis = sszvis
      .axisX()
      .scale(widthScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(props.ticks)
      .title(props.xLabel);

    const yAxis = sszvis.axisY.ordinal().scale(yScale).orient("right");

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d) => {
        const value = xAcc(d);
        return Number.isNaN(value) ? "k. A." : sszvis.formatNumber(value);
      })
      .plain(props.xLabel);

    const tooltip = sszvis
      .tooltip()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .header(tooltipHeader)
      .visible((d) => sszvis.contains(state.selection, d));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - chartWidth / 2, bounds.padding.top),
    );

    const bars = chartLayer.selectGroup("bars").call(barGen);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.totalHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .attr("transform", sszvis.translateString(0, chartDimensions.axisOffset))
      .call(yAxis);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    // Interaction

    const interactionLayer = sszvis
      .move()
      .xScale(widthScale)
      .yScale(yScale)
      .cancelScrolling(isWithinBarContour(state))
      .fireOnPanOnly(true)
      .on("move", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

/**
 * On touch devices, scrolling is cancelled while the cursor is over a bar, so
 * that a pan gesture reads as a tooltip query. Bars that are very short, or
 * that have no value at all, are still reachable within
 * \`BAR_TOUCH_THRESHOLD\` of the zero line.
 */
const isWithinBarContour = (state) => (xValue, category) => {
  if (xValue == null || category == null) {
    return false;
  }
  const barDatum = state.data.find((d) => cAcc(d) === category);
  if (barDatum === undefined) {
    return false;
  }
  return Number.isNaN(xAcc(barDatum))
    ? xValue < BAR_TOUCH_THRESHOLD
    : xValue < Math.max(xAcc(barDatum), BAR_TOUCH_THRESHOLD);
};`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Basic horizontal bar chart example using sszvis.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    bar-chart-horizontal</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAX_WIDTH </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 800</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> In the x scale's own domain units - employees - not pixels. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> BAR_TOUCH_THRESHOLD </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 1000</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> SERIES_KEY </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zupendler</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Beschäftigte</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> palm</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 4</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 5 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
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
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Sektor</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zupendler</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">set</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">filter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Render</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">dimensionsHorizontalBarChart</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">length</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 30 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalHeight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">+</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 40</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 30</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 40</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">min</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> MAX_WIDTH</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> widthScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleBand</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padRatio</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">paddingOuter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">outerRatio</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">rangeRound</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">])</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: One series, so one colour: the categories are already named on the y axis</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFill </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleQual12</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Zupendler nach Sektor</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Anzahl Zupendlerinnen und Zupendler je Wirtschaftssektor.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    });</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barGen </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bar</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">x</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">y</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> widthScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">centerTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barFill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">axisX</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">widthScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">alignOuterLabels</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">axisY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ordinal</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipHeader </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> value </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">        return</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isNaN</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ?</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">k. A.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">plain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fitTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipHeader</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bars </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barGen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">axisOffset</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">widthScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">cancelScrolling</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isWithinBarContour</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fireOnPanOnly</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">showTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">hideTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interaction</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Helper functions</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * On touch devices, scrolling is cancelled while the cursor is over a bar, so</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * that a pan gesture reads as a tooltip query. Bars that are very short, or</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * that have no value at all, are still reachable within</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * \`BAR_TOUCH_THRESHOLD\` of the zero line.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> isWithinBarContour</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xValue</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  if</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ||</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    return</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> false</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  }</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barDatum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">find</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> category</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  if</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barDatum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">===</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> undefined</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    return</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> false</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  }</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">  return</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isNaN</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    ?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> BAR_TOUCH_THRESHOLD</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xValue </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barDatum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">),</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> BAR_TOUCH_THRESHOLD</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span></code></pre>`},csv:{raw:`Sektor,Zupendler
Landwirtschaft,933
Nahrungsmittel und Papier,5389
Chemie und Metall,1563
Maschinen und Geräte,3262
Wasser und Energie,696
Bau,6823
Gross- und Detailhandel,20892
Gastgewerbe,8135
"Transport, Logistik und Kommunikation radioaktiver Abfälle für die Endlagerung",12016
Finanzsektor,39517
"Immobilien, Informatik",33145
Gesundheits- und Sozialwesen,41139
sonstige Dienstleistungen,1609
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Sektor,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Zupendler</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Landwirtschaft,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">933</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Nahrungsmittel und Papier,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">5389</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Chemie und Metall,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1563</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Maschinen und Geräte,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">3262</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Wasser und Energie,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">696</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Bau,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">6823</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Gross- und Detailhandel,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">20892</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Gastgewerbe,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">8135</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">"Transport, Logistik und Kommunikation radioaktiver Abfälle für die Endlagerung",</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">12016</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Finanzsektor,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">39517</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">"Immobilien, Informatik",</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">33145</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Gesundheits- und Sozialwesen,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">41139</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sonstige Dienstleistungen,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">1609</span></span>
<span class="line"></span></code></pre>`}};export{e as default};