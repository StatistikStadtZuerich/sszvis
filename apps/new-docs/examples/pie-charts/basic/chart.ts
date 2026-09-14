/**
 * Basic pie chart example using sszvis.
 *
 * @category pie-charts
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
        value: sszvis.parseNumber(d["Schweiz Import"] ?? ""),
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
