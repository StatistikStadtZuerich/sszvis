var e={ts:{raw:`/**
 * Vertical bar chart example showing a single series over many years.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-vertical
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

// NOTE: The chart shows a single series, so every bar uses the same palette
// colour; this is the ordinal scale's only key.
const SERIES_KEY = "Hotelübernachtungen";
/** Extra space in pixels between the y axis labels and the chart area. */
const Y_LABEL_GUTTER = 10;

// Types

type Datum = {
  year: string;
  value: number;
};

type State = {
  data: Datum[];
  categories: string[];
  selection: Datum[];
};

type Actions = {
  changeYear: (state: State, e: Event, year: string | null, yValue: number | null) => void;
  resetYear: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", { palm: 0.2, _: 0.1 })
  .prop("leftPadding", { _: null })
  .prop("yLabelFormat", { _: () => sszvis.formatNumber });

// Accessors

const xAcc = (d: Datum) => d.year;
const yAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        year: d["Jahr"] ?? "",
        value: sszvis.parseNumber(d["Hotelübernachtungen"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, xAcc);
        state.selection = [];
      }),

  actions: {
    // NOTE: The move behavior inverts the pointer position through the band
    // scale, so it hands back a year from the scale's domain, or null outside
    // of it.
    changeYear(state, _e, year) {
      state.selection = state.data.filter((d) => xAcc(d) === year);
    },

    resetYear(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const yMax = d3.max(state.data, yAcc) ?? 0;
    const bounds = sszvis.bounds(
      {
        top: 3,
        bottom: 25,
        left:
          props.leftPadding == null
            ? sszvis.measureAxisLabel(props.yLabelFormat(yMax)) + Y_LABEL_GUTTER
            : props.leftPadding,
      },
      config.id,
    );

    const chartDimensions = sszvis.dimensionsVerticalBarChart(
      bounds.innerWidth,
      state.categories.length,
    );

    // Scales

    const xScale = d3
      .scaleBand<string>()
      .domain(state.categories)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    const heightScale = d3.scaleLinear().domain([0, yMax]).range([0, bounds.innerHeight]);

    const yPosScale = heightScale.copy().range([...heightScale.range()].reverse());

    const cScale = sszvis.scaleQual12().domain([SERIES_KEY]);
    const barFill = cScale(SERIES_KEY);
    const barFillHighlight = cScale.darker()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Hotelübernachtungen in der Stadt Zürich",
        description: "Anzahl Hotelübernachtungen pro Jahr seit 1919.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar<Datum>()
      // NOTE: The band scale's domain is built from the data, so every datum has
      // a position; the fallback only satisfies its \`number | undefined\` return.
      .x((d) => xScale(xAcc(d)) ?? 0)
      // NOTE: Rounding the y-position and the height prevents the bars from
      // jumping around as the chart is resized.
      .y((d) => Math.round(yPosScale(yAcc(d))))
      .width(xScale.bandwidth())
      .height((d) => Math.round(heightScale(yAcc(d))))
      .fill((d) => (isSelected(state)(d) ? barFillHighlight : barFill));

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(5);

    const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

    const tooltipTitle = sszvis
      .modularTextHTML()
      .bold((d: Datum) => sszvis.formatNumber(yAcc(d)))
      .plain("Hotelübernachtungen");

    const tooltip = sszvis
      .tooltip<Datum>()
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .renderInto(tooltipLayer)
      .header(tooltipTitle)
      .body((d) => \`Im Jahr \${xAcc(d)}\`)
      .visible(isSelected(state));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(
        bounds.innerWidth / 2 - chartDimensions.totalWidth / 2,
        bounds.padding.top,
      ),
    );

    const bars = chartLayer
      .selectGroup("bars")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(barGen);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    bars
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    // Interaction

    const interactionLayer = sszvis
      .move<string, number>()
      .xScale(xScale)
      .yScale(yPosScale)
      .on("move", actions.changeYear)
      .on("end", actions.resetYear);

    bars.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

const isSelected = (state: State) => (d: Datum) => sszvis.contains(state.selection, d);
`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Vertical bar chart example showing a single series over many years.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    bar-chart-vertical</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The chart shows a single series, so every bar uses the same palette</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> colour; this is the ordinal scale's only key.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> SERIES_KEY </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Extra space in pixels between the y axis labels and the chart area. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Y_LABEL_GUTTER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 10</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  year</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  value</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  data</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  categories</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  selection</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">type</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  changeYear</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> e</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Event</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> year</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> string </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">|</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yValue</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">|</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  resetYear</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> void</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">};</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> palm</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0.2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0.1 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">})</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leftPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yLabelFormat</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ()</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">formatNumber </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> yAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Jahr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">set</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The move behavior inverts the pointer position through the band</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> scale, so it hands back a year from the scale's domain, or null outside</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> of it.</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    changeYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">filter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    resetYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yMax </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 25</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">          props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leftPadding </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">            ?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureAxisLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yLabelFormat</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yMax</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> +</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Y_LABEL_GUTTER</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">            :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leftPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">dimensionsVerticalBarChart</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">length</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleBand</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padRatio</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">paddingOuter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> heightScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yMax</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yPosScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> heightScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">copy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">...</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">heightScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()].</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">reverse</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleQual12</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFill </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFillHighlight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">darker</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen in der Stadt Zürich</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Anzahl Hotelübernachtungen pro Jahr seit 1919.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barGen </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bar</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The band scale's domain is built from the data, so every datum has</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> a position; the fallback only satisfies its \`number | undefined\` return.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">x</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: Rounding the y-position and the height prevents the bars from</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> jumping around as the chart is resized.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">y</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">round</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yPosScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bandwidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">())</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">round</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">heightScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isSelected</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFillHighlight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">axisX</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ordinal</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">alignOuterLabels</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">5</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">axisY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yPosScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipTitle </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">plain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fitTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipTitle</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">body</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> \`</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Im Jahr </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">\${</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">}\`</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isSelected</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      ),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bars </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barGen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">&#x3C;</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">string</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> number</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">>()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yPosScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">changeYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">resetYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interaction</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Helper functions</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> isSelected</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> State</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span></code></pre>`},js:{raw:`/**
 * Vertical bar chart example showing a single series over many years.
 *
 * @sszvis   3.5.1
 * @chart    bar-chart-vertical
 * @features tooltip
 * @date     2026-09-14
 */

// Magic Numbers

// NOTE: The chart shows a single series, so every bar uses the same palette
// colour; this is the ordinal scale's only key.
const SERIES_KEY = "Hotelübernachtungen";
/** Extra space in pixels between the y axis labels and the chart area. */
const Y_LABEL_GUTTER = 10;

// Types

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("barPadding", { palm: 0.2, _: 0.1 })
  .prop("leftPadding", { _: null })
  .prop("yLabelFormat", { _: () => sszvis.formatNumber });

// Accessors

const xAcc = (d) => d.year;
const yAcc = (d) => d.value;

// Application

sszvis.app({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        year: d["Jahr"] ?? "",
        value: sszvis.parseNumber(d["Hotelübernachtungen"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, xAcc);
        state.selection = [];
      }),

  actions: {
    // NOTE: The move behavior inverts the pointer position through the band
    // scale, so it hands back a year from the scale's domain, or null outside
    // of it.
    changeYear(state, _e, year) {
      state.selection = state.data.filter((d) => xAcc(d) === year);
    },

    resetYear(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const yMax = d3.max(state.data, yAcc) ?? 0;
    const bounds = sszvis.bounds(
      {
        top: 3,
        bottom: 25,
        left:
          props.leftPadding == null
            ? sszvis.measureAxisLabel(props.yLabelFormat(yMax)) + Y_LABEL_GUTTER
            : props.leftPadding,
      },
      config.id,
    );

    const chartDimensions = sszvis.dimensionsVerticalBarChart(
      bounds.innerWidth,
      state.categories.length,
    );

    // Scales

    const xScale = d3
      .scaleBand()
      .domain(state.categories)
      .padding(chartDimensions.padRatio)
      .paddingOuter(props.barPadding)
      .range([0, chartDimensions.totalWidth]);

    const heightScale = d3.scaleLinear().domain([0, yMax]).range([0, bounds.innerHeight]);

    const yPosScale = heightScale.copy().range([...heightScale.range()].reverse());

    const cScale = sszvis.scaleQual12().domain([SERIES_KEY]);
    const barFill = cScale(SERIES_KEY);
    const barFillHighlight = cScale.darker()(SERIES_KEY);

    // Layers

    const chartLayer = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Hotelübernachtungen in der Stadt Zürich",
        description: "Anzahl Hotelübernachtungen pro Jahr seit 1919.",
      })
      .datum(state.data);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.selection);

    // Components

    const barGen = sszvis
      .bar()
      // NOTE: The band scale's domain is built from the data, so every datum has
      // a position; the fallback only satisfies its \`number | undefined\` return.
      .x((d) => xScale(xAcc(d)) ?? 0)
      // NOTE: Rounding the y-position and the height prevents the bars from
      // jumping around as the chart is resized.
      .y((d) => Math.round(yPosScale(yAcc(d))))
      .width(xScale.bandwidth())
      .height((d) => Math.round(heightScale(yAcc(d))))
      .fill((d) => (isSelected(state)(d) ? barFillHighlight : barFill));

    const xAxis = sszvis.axisX
      .ordinal()
      .scale(xScale)
      .orient("bottom")
      .alignOuterLabels(true)
      .ticks(5);

    const yAxis = sszvis.axisY().scale(yPosScale).orient("right");

    const tooltipTitle = sszvis
      .modularTextHTML()
      .bold((d) => sszvis.formatNumber(yAcc(d)))
      .plain("Hotelübernachtungen");

    const tooltip = sszvis
      .tooltip()
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .renderInto(tooltipLayer)
      .header(tooltipTitle)
      .body((d) => \`Im Jahr \${xAcc(d)}\`)
      .visible(isSelected(state));

    // Rendering

    chartLayer.attr(
      "transform",
      sszvis.translateString(
        bounds.innerWidth / 2 - chartDimensions.totalWidth / 2,
        bounds.padding.top,
      ),
    );

    const bars = chartLayer
      .selectGroup("bars")
      .attr("transform", sszvis.translateString(bounds.padding.left, 0))
      .call(barGen);

    bars.selectAll("[data-tooltip-anchor]").call(tooltip);

    bars
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    // Interaction

    const interactionLayer = sszvis
      .move()
      .xScale(xScale)
      .yScale(yPosScale)
      .on("move", actions.changeYear)
      .on("end", actions.resetYear);

    bars.selectGroup("interaction").call(interactionLayer);
  },
});

// Helper functions

const isSelected = (state) => (d) => sszvis.contains(state.selection, d);`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * Vertical bar chart example showing a single series over many years.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> *</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">sszvis   3.5.1</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">chart    bar-chart-vertical</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">features tooltip</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> * </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">@</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">date     2026-09-14</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> */</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Magic Numbers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The chart shows a single series, so every bar uses the same palette</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> colour; this is the ordinal scale's only key.</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> SERIES_KEY </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">/**</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Extra space in pixels between the y axis labels and the chart area. </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">*/</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Y_LABEL_GUTTER </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 10</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Types</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Responsive Props</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> queryProps </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">responsiveProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> palm</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0.2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0.1 </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">})</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leftPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">prop</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yLabelFormat</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> _</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ()</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">formatNumber </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Accessors</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> yAcc</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Application</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">app</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  fallback</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> element</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> src</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">fallback </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">},</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  init</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">csv</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ({</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Jahr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> ""</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        value</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">parseNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">[</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">then</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">set</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      }),</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">  actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The move behavior inverts the pointer position through the band</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> scale, so it hands back a year from the scale's domain, or null outside</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> of it.</span></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    changeYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> _e</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">filter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ===</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> year</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">    resetYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> [];</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">  render</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> queryProps</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yMax </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">max</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">;</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 25</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">          props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leftPadding </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">==</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> null</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">            ?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">measureAxisLabel</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yLabelFormat</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yMax</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> +</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Y_LABEL_GUTTER</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">            :</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">leftPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      },</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">dimensionsVerticalBarChart</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">length</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Scales</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleBand</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">categories</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padRatio</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">paddingOuter</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">props</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barPadding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalWidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> heightScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d3</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleLinear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yMax</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yPosScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> heightScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">copy</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">...</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">heightScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">range</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()].</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">reverse</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cScale </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scaleQual12</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">domain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">([</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">]);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFill </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFillHighlight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> cScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">darker</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">SERIES_KEY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Layers</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createSvgLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> {</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        title</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen in der Stadt Zürich</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        description</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">:</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Anzahl Hotelübernachtungen pro Jahr seit 1919.</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      })</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">data</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">createHtmlLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">config</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">id</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">datum</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Components</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barGen </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bar</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: The band scale's domain is built from the data, so every datum has</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> a position; the fallback only satisfies its \`number | undefined\` return.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">x</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ??</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> NOTE: Rounding the y-position and the height prevents the bars from</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> jumping around as the chart is resized.</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">y</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">round</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yPosScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">width</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bandwidth</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">())</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">height</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> Math</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">round</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">heightScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isSelected</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> ?</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFillHighlight </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">:</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> barFill</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> xAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">axisX</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ordinal</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">alignOuterLabels</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">true</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">ticks</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">5</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> yAxis </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">axisY</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">().</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">scale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yPosScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orient</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">right</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltipTitle </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">modularTextHTML</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">bold</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">formatNumber</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">plain</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Hotelübernachtungen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> tooltip </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">orientation</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">fitTooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bottom</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">renderInto</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">header</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltipTitle</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">body</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">((</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> \`</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Im Jahr </span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">\${</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xAcc</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">}\`</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">visible</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">isSelected</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">));</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Rendering</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      "</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">      sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2 </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">-</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartDimensions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">totalWidth </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">/</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 2</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">        bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">top</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      ),</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    );</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bars </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> chartLayer</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">padding</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">left</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> 0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">barGen</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectAll</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">[data-tooltip-anchor]</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">tooltip</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">attr</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">transform</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">translateString</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">0</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> bounds</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">innerHeight</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">))</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    chartLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yAxis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">    //</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Interaction</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">    const</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> interactionLayer </span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">=</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">()</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">xScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">yScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">yPosScale</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">move</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">changeYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">      .</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">on</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">end</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> actions</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">resetYear</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">    bars</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">selectGroup</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interaction</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">"</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">).</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">call</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">interactionLayer</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">  },</span></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">//</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> Helper functions</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">const</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F"> isSelected</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C"> (</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">)</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0"> =></span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> sszvis</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#D33944;--shiki-dark:#FF8F8F">contains</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">(</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">state</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">.</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">selection</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">,</span><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3"> d</span><span style="--shiki-light:#535353;--shiki-dark:#8C8C8C">);</span></span></code></pre>`},csv:{raw:`Jahr,Hotelübernachtungen
1919,736
1920,707
1921,691
1922,664
1923,657
1924,654
1925,644
1926,626
1927,600
1928,581
1929,555
1930,506
1931,451
1932,479
1933,562
1934,617
1935,654
1936,672
1937,661
1938,628
1939,592
1940,550
1941,514
1942,522
1943,519
1944,476
1945,452
1946,470
1947,484
1948,486
1949,482
1950,470
1951,456
1952,442
1953,420
1954,393
1955,372
1956,319
1957,287
1958,283
1959,254
1960,204
1961,136
1962,66
1963,64
1964,136
1965,229
1966,321
1967,392
1968,457
1969,519
1970,587
1971,621
1972,626
1973,655
1974,685
1975,670
1976,637
1977,631`,html:`<pre class="shiki shiki-themes catalog-light catalog-dark" style="--shiki-light:#00263e;--shiki-dark:#cbd9e3;--shiki-light-bg:#ffffff;--shiki-dark-bg:#111111" tabindex="0"><code><span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">Jahr,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">Hotelübernachtungen</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1919,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">736</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1920,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">707</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1921,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">691</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1922,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">664</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1923,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">657</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1924,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">654</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1925,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">644</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1926,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">626</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1927,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">600</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1928,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">581</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1929,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">555</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1930,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">506</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1931,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">451</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1932,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">479</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1933,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">562</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1934,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">617</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1935,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">654</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1936,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">672</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1937,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">661</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1938,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">628</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1939,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">592</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1940,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">550</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1941,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">514</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1942,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">522</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1943,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">519</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1944,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">476</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1945,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">452</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1946,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">470</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1947,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">484</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1948,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">486</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1949,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">482</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1950,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">470</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1951,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">456</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1952,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">442</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1953,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">420</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1954,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">393</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1955,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">372</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1956,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">319</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1957,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">287</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1958,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">283</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1959,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">254</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1960,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">204</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1961,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">136</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1962,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">66</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1963,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">64</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1964,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">136</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1965,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">229</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1966,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">321</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1967,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">392</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1968,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">457</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1969,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">519</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1970,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">587</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1971,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">621</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1972,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">626</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1973,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">655</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1974,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">685</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1975,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">670</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1976,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">637</span></span>
<span class="line"><span style="--shiki-light:#00263E;--shiki-dark:#CBD9E3">1977,</span><span style="--shiki-light:#3F7397;--shiki-dark:#7FB0D0">631</span></span></code></pre>`,lines:96,url:`/sszvis/preview/bar-chart-vertical/many-years/data.csv`}};export{e as default};