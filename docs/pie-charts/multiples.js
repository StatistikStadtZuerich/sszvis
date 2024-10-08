/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const PIE_DIAMETER = 204;
const LEGEND_PADDING = 40;
const MAX_WIDTH = 3 * PIE_DIAMETER + 30;

const queryProps = sszvis
  .responsiveProps()
  .prop("rowsCols", {
    palm: [5, 1],
    lap: [3, 2],
    _: [2, 3],
  })
  .prop("colorLegendColumns", {
    palm: 1,
    _: 2,
  })
  .prop("bounds", {
    palm() {
      const legendHeight = 182;
      const bottomPadding = LEGEND_PADDING + legendHeight + 20;
      return {
        top: 20,
        right: 10,
        bottom: bottomPadding,
        left: 10,
        height: 20 + 5 * PIE_DIAMETER + 4 * 30 + bottomPadding,
      };
    },
    lap() {
      const legendHeight = 98;
      const bottomPadding = LEGEND_PADDING + legendHeight + 20;
      return {
        top: 20,
        right: 20,
        bottom: bottomPadding,
        left: 20,
        height: 20 + 3 * PIE_DIAMETER + 2 * 30 + bottomPadding,
      };
    },
    _() {
      const legendHeight = 98;
      const bottomPadding = LEGEND_PADDING + legendHeight + 20;
      return {
        top: 20,
        right: 20,
        bottom: bottomPadding,
        left: 20,
        height: 20 + 2 * PIE_DIAMETER + 3 * 30 + bottomPadding,
      };
    },
  })
  .prop("legendPosition", {
    palm(w) {
      return () => ({
        top: LEGEND_PADDING,
        left: (w - 2 * 10) / 2 - PIE_DIAMETER / 2,
      });
    },
    lap() {
      return (bounds, g) => {
        const left = bounds.innerWidth / 2 - g.cx - 10 - pieRadius(g.gw, g.gh);
        return {
          top: LEGEND_PADDING,
          left,
        };
      };
    },
    _(w) {
      return () => {
        const colWidth = Math.min(w, MAX_WIDTH) / 2;
        return {
          top: LEGEND_PADDING,
          left: (w - 2 * 10) / 2 - colWidth,
        };
      };
    },
  })
  .prop("tooltipVisibility", {
    palm() {
      return () => false;
    },
    _() {
      return isSelected;
    },
  });

function parseRow(d) {
  return {
    group: d["Gruppe"],
    category: d["Kategorie"],
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}

const gAcc = sszvis.prop("group");
const vAcc = sszvis.prop("value");
const cAcc = sszvis.prop("category");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  groups: [],
  totalValues: {},
  pieGroups: [],
  categories: [],
  hoveredDatum: {},
  selection: [],
  selectedCategories: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    // groups the data into arrays by their 'group' value
    const grouped = sszvis
      .cascade()
      .arrayBy(gAcc, (g1, g2) => state.groups.indexOf(g1) - state.groups.indexOf(g2))
      .apply(data);

    state.data = data;
    // a list of groups
    state.groups = sszvis.set(state.data, gAcc);
    // an index of the total values of the groups. Used for calculating the slice size of each component of the pie chart
    state.totalValues = grouped.reduce((memo, group, i) => {
      memo[state.groups[i]] = d3.sum(group, vAcc);
      return memo;
    }, {});
    // map the groups into data objects, with a group name and a set of values
    state.pieGroups = grouped.map((g, i) => ({
      group: state.groups[i],
      values: g,
    }));
    // a list of categories (for the color scale)
    state.categories = sszvis.set(state.data, cAcc);

    render(state);
  },

  showTooltip(e, datum) {
    state.hoveredDatum = datum;
    state.selection = state.data.filter((d) => datum.category === d.category);
    state.selectedCategories = state.selection.map(cAcc);
    render(state);
  },

  hideTooltip() {
    state.hoveredDatum = {};
    state.selection = [];
    state.selectedCategories = [];
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  const props = queryProps(sszvis.measureDimensions(config.id));
  const bounds = sszvis.bounds(props.bounds, config.id);

  // Scales

  // this is a basic scale for the pie chart segment angles. It has no range because it will be copied
  // and a different range set, for each pie chart in the multiples.
  const aScale = d3.scaleLinear().range([0, 2 * Math.PI]);

  const cScale = sszvis.scaleQual12().domain(state.categories);

  // Layers

  const chart = sszvis.createSvgLayer(config.id, bounds).datum(state.pieGroups);

  const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components

  const pieMaker = sszvis.pie().fill(sszvis.compose(cScale, cAcc));

  // this component generates svg 'g' tags into which chart instances can be rendered
  const multiplesMaker = sszvis
    .layoutSmallMultiples()
    .width(Math.min(bounds.innerWidth, MAX_WIDTH))
    .height(bounds.innerHeight)
    .paddingX(30)
    .paddingY(30)
    .rows(props.rowsCols[0])
    .cols(props.rowsCols[1]);

  const colorLegend = sszvis
    .legendColorOrdinal()
    .scale(cScale)
    .columnWidth(Math.min(bounds.innerWidth, MAX_WIDTH) / 2)
    .columns(props.colorLegendColumns)
    .orientation("horizontal");

  // the infotip has special behavior because it shows up even when its directly
  // associate element isn't hovered, but another element in the same category is.
  // In these case, the infotip is faded slightly (by the infotipOpacity function),
  // but the infotip under the mouse position has full opacity.
  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .header(cAcc)
    .body((d) => "Anzahl: " + d.value)
    .opacity(tooltipOpacity)
    .visible(props.tooltipVisibility);

  // Rendering

  const pieCharts = chart
    .selectGroup("piecharts")
    .attr(
      "transform",
      sszvis.translateString(bounds.innerWidth / 2 - multiplesMaker.width() / 2, 0)
    )
    .call(multiplesMaker);

  // grab all of the prepared groups, and render a pie chart into each of them
  pieCharts.selectAll(".sszvis-multiple").each(function (d) {
    // inside this closure, create a copy of the angle scale
    // which is relative to the group total calculated earlier
    const groupScale = aScale.copy().domain([0, state.totalValues[d.group]]);

    const pieR = pieRadius(d.gw, d.gh);

    // configure the pieMaker component for this particular group
    pieMaker.radius(pieR).angle(sszvis.compose(groupScale, vAcc));

    // render the pie chart inside this group
    d3.select(this)
      .selectAll(".sszvis-multiple-chart")
      .attr("transform", sszvis.translateString(d.cx - pieR, d.cy - pieR))
      .call(pieMaker);
  });

  // attach the tooltips
  pieCharts.selectAll("[data-tooltip-anchor]").call(tooltip);

  const legendPosition = props.legendPosition(bounds, state.pieGroups[0]);
  chart
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(legendPosition.left, bounds.innerHeight + legendPosition.top)
    )
    .call(colorLegend);

  // Interaction

  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-path")
    .on("start", actions.showTooltip)
    .on("pan", actions.showTooltip)
    .on("end", actions.hideTooltip);

  pieCharts.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
function isSelected(d) {
  return sszvis.contains(state.selectedCategories, d.category);
}

function pieRadius(w, h) {
  return Math.min(w, h) / 2;
}

function tooltipOpacity(d) {
  return d.datum === state.hoveredDatum ? 1 : 0.75;
}
