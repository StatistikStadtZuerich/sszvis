/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const MIN_CHART_HEIGHT = 650;
const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    palm: (w) => ({
      top: 40,
      left: 0,
      bottom: 20,
      right: 0,
      height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + 40 + 20),
    }),
    _: (w) => ({
      top: 40,
      left: w / 4,
      bottom: 20,
      right: w / 4,
      height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + 40 + 20),
    }),
  })
  .prop("labelSide", {
    palm: "inside",
    _: "outside",
  })
  .prop("hitboxSize", {
    palm: 60,
    _: 120,
  });

function parseRow(d) {
  return {
    source: d["Zuzugsregion"],
    target: d["Stadtquartier"],
    value: sszvis.parseNumber(d["Anzahl"]),
  };
}

const sourceAcc = sszvis.prop("source");
const targetAcc = sszvis.prop("target");
const valueAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  hoveredNode: {},
  hoveredLink: {},
  linkSourceLabels: [],
  linkTargetLabels: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    const leftColIds = sszvis.set(data, sourceAcc);
    const rightColIds = sszvis.set(data, targetAcc);

    state.data = sszvis
      .sankeyPrepareData()
      .source(sourceAcc)
      .target(targetAcc)
      .value(valueAcc)
      .idLists([leftColIds, rightColIds])
      .apply(data);

    state.hoveredNode = null;

    render(state);
  },

  onNodeOver(e, d) {
    state.hoveredNode = d;
    state.linkSourceLabels = d.linksTo;
    state.linkTargetLabels = d.linksFrom;

    state.hoveredLink = {};

    render(state);
  },

  onNodeOut() {
    state.hoveredNode = null;
    state.linkSourceLabels = [];
    state.linkTargetLabels = [];

    state.hoveredLink = {};

    render(state);
  },

  onLinkOver(e, d) {
    state.hoveredLink = d;
    state.hoveredNode = null;

    render(state);
  },

  onLinkOut() {
    state.hoveredLink = {};
    state.hoveredNode = null;

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

  // The right and left padding are chosen so that there is enough space on either side of the chart
  // to see all labels. For performance reasons, it doesn't make sense to calculate these values while
  // the chart is being rendered, so it is much more efficient to simply choose a value for the left
  // and right padding which reveals the labels. When using the sszvis.sankeyLayout function,
  // the chart will be positioned such that the node bars themselves line up with the edges of the available
  // space, and any outside bar labels (e.g. 'left' labels for a lefthand column) are outside, in the padding space.
  const bounds = sszvis.bounds(props.bounds, config.id);

  // Compute visual display dimensions of the sankey diagram, like the visible pixels per unit,
  // and the domain and range of the linear scale which displays the sankey nodes as bars and links as arcs.
  // The order of bounds.innerHeight and bounds.innerWidth needs to be reversed when doing a horizontal orientation
  const sankeyLayout = sszvis.sankeyLayout(
    state.data.columnLengths,
    state.data.columnTotals,
    bounds.innerHeight,
    bounds.innerWidth
  );

  // Scales

  const valueScale = d3
    .scaleLinear()
    .domain(sankeyLayout.valueDomain)
    .range(sankeyLayout.valueRange);

  const columnPosition = d3
    .scaleLinear()
    .domain(sankeyLayout.columnDomain)
    .range(sankeyLayout.columnRange);

  // Layers

  const chartLayer = sszvis.createSvgLayer(config.id, bounds);

  const linkTooltipLayer = sszvis.createHtmlLayer(config.id, bounds, {
    key: "linkTooltipLayer",
  });

  const nodeTooltipLayer = sszvis.createHtmlLayer(config.id, bounds, {
    key: "nodeTooltipLayer",
  });

  const nodeBlue = sszvis.scaleQual12().range()[0];
  const highlightLinkBlue = sszvis.scaleQual12().range()[1];
  const linkGrey = sszvis.scalePaleGry()(0);

  // Components

  const formatValue = sszvis.compose(sszvis.formatPreciseNumber(0), valueAcc);

  const sankeyGen = sszvis
    .sankey()
    .sizeScale(valueScale)
    .columnPosition(columnPosition)
    .columnLabel((columnIndex) => ["Zuzugsregion", "Stadtquartier"][columnIndex])
    .nodeThickness(sankeyLayout.nodeThickness)
    .nodePadding(sankeyLayout.nodePadding)
    .columnPadding((columnIndex) => sankeyLayout.columnPaddings[columnIndex])
    .columnLabelOffset((d, i) => {
      if (props.labelSide === "inside") {
        return i === 0 ? 24 : -24;
      } else {
        return 0;
      }
    })
    .nodeColor(nodeBlue)
    .linkColor((d) => (linkIsSelected(d) ? highlightLinkBlue : linkGrey))
    .linkSort((a, b) =>
      linkIsSelected(a) ? 1 : linkIsSelected(b) ? -1 : valueAcc(a) - valueAcc(b)
    )
    .linkSourceLabels(state.linkSourceLabels)
    .linkTargetLabels(state.linkTargetLabels)
    .linkLabel(formatValue)
    .labelSideSwitch(props.labelSide === "inside")
    .labelSide((columnIndex) =>
      columnPosition(columnIndex) > bounds.innerWidth / 2 ? "right" : "left"
    )
    .labelOpacity(() => (props.labelSide === "inside" && state.hoveredNode !== null ? 0 : 1))
    .labelHitBoxSize(props.hitboxSize)
    .nameLabel((id) => id);

  const linkTooltip = sszvis
    .tooltip()
    .renderInto(linkTooltipLayer)
    .header(sszvis.modularTextHTML().bold(formatValue))
    .visible(linkIsHovered);

  const nodeTooltip = sszvis
    .tooltip()
    .renderInto(nodeTooltipLayer)
    .visible(nodeIsHovered)
    .header(sszvis.modularTextHTML().bold(formatValue))
    .orientation((d) => (d.x >= bounds.innerWidth / 2 ? "right" : "left"))
    .dx(20);

  // Rendering

  const sankeyGroup = chartLayer.selectGroup("sankey");

  sankeyGroup.datum(state.data).call(sankeyGen);

  const nodesGroup = sankeyGroup.selectGroup("nodes");

  nodesGroup.selectAll("[data-tooltip-anchor]").call(nodeTooltip);

  const linksGroup = sankeyGroup.selectGroup("links");

  linksGroup
    .selectAll(".sszvis-link")
    .on("mouseover", actions.onLinkOver)
    .on("mouseout", actions.onLinkOut);

  linksGroup.selectAll("[data-tooltip-anchor]").call(linkTooltip);

  // Interaction

  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-sankey-hitbox")
    .on("start", actions.onNodeOver)
    .on("pan", actions.onNodeOver)
    .on("end", actions.onNodeOut);

  sankeyGroup.selectGroup("nodelabels").call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

function linkIsSelected(d) {
  return linkIsHovered(d) || nodeIsHovered(d.src) || nodeIsHovered(d.tgt);
}

function nodeIsHovered(d) {
  return state.hoveredNode === d;
}

function linkIsHovered(d) {
  return state.hoveredLink === d;
}
