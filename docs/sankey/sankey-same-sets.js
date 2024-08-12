/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

var MIN_CHART_HEIGHT = 650;
var queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    palm: function (w) {
      return {
        top: 40,
        left: 0,
        bottom: 20,
        right: 0,
        height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + 40 + 20),
      };
    },
    _: function (w) {
      return {
        top: 40,
        left: w / 4,
        bottom: 20,
        right: w / 4,
        height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + 40 + 20),
      };
    },
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
    source: d["source"],
    target: d["target"],
    value: sszvis.parseNumber(d["value"]),
  };
}

var sourceAcc = sszvis.prop("source");
var targetAcc = sszvis.prop("target");
var valueAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
var state = {
  data: [],
  hoveredNode: {},
  hoveredLink: {},
  linkSourceLabels: [],
  linkTargetLabels: [],
};

// State transitions
// -----------------------------------------------
var actions = {
  prepareState: function (data) {
    var leftColIds = sszvis.set(data, sourceAcc);
    var rightColIds = sszvis.set(data, targetAcc);

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

  onNodeOver: function (e, d) {
    state.hoveredNode = d;
    state.linkSourceLabels = d.linksTo;
    state.linkTargetLabels = d.linksFrom;

    state.hoveredLink = {};

    render(state);
  },

  onNodeOut: function () {
    state.hoveredNode = null;
    state.linkSourceLabels = [];
    state.linkTargetLabels = [];

    state.hoveredLink = {};

    render(state);
  },

  onLinkOver: function (e, d) {
    state.hoveredLink = d;
    state.hoveredNode = null;

    render(state);
  },

  onLinkOut: function () {
    state.hoveredLink = {};
    state.hoveredNode = null;

    render(state);
  },

  resize: function () {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  var props = queryProps(sszvis.measureDimensions(config.id));
  var bounds = sszvis.bounds(props.bounds, config.id);

  // Compute visual display dimensions of the sankey diagram, like the visible pixels per unit,
  // and the domain and range of the linear scale which displays the sankey nodes as bars and links as arcs.
  // The order of bounds.innerHeight and bounds.innerWidth needs to be reversed when doing a horizontal orientation
  var sankeyLayout = sszvis.sankeyLayout(
    state.data.columnLengths,
    state.data.columnTotals,
    bounds.innerHeight,
    bounds.innerWidth
  );

  // Scales

  var valueScale = d3.scaleLinear().domain(sankeyLayout.valueDomain).range(sankeyLayout.valueRange);

  var columnPosition = d3
    .scaleLinear()
    .domain(sankeyLayout.columnDomain)
    .range(sankeyLayout.columnRange);

  // Layers

  var chartLayer = sszvis.createSvgLayer(config.id, bounds);

  var linkTooltipLayer = sszvis.createHtmlLayer(config.id, bounds, {
    key: "linkTooltipLayer",
  });

  var nodeTooltipLayer = sszvis.createHtmlLayer(config.id, bounds, {
    key: "nodeTooltipLayer",
  });

  var nodeBlue = sszvis.scaleQual12().range()[0];
  var highlightLinkBlue = sszvis.scaleQual12().range()[1];
  var linkGrey = sszvis.scalePaleGry()(0);

  // Components

  var formatValue = sszvis.compose(sszvis.formatPreciseNumber(0), valueAcc);

  var sankeyGen = sszvis
    .sankey()
    .sizeScale(valueScale)
    .columnPosition(columnPosition)
    .columnLabel(function (columnIndex) {
      return ["Auszugsquartier", "Einzugsquartier"][columnIndex];
    })
    .nodeThickness(sankeyLayout.nodeThickness)
    .nodePadding(sankeyLayout.nodePadding)
    .columnPadding(function (columnIndex) {
      return sankeyLayout.columnPaddings[columnIndex];
    })
    .columnLabelOffset(function (d, i) {
      if (props.labelSide === "inside") {
        return i === 0 ? 28 : -28;
      } else {
        return 0;
      }
    })
    .nodeColor(nodeBlue)
    .linkColor(function (d) {
      return linkIsSelected(d) ? highlightLinkBlue : linkGrey;
    })
    .linkSort(function (a, b) {
      return linkIsSelected(a) ? 1 : (linkIsSelected(b) ? -1 : valueAcc(a) - valueAcc(b));
    })
    .linkSourceLabels(state.linkSourceLabels)
    .linkTargetLabels(state.linkTargetLabels)
    .linkLabel(formatValue)
    .labelSideSwitch(props.labelSide === "inside")
    .labelSide(function (columnIndex) {
      return columnPosition(columnIndex) > bounds.innerWidth / 2 ? "right" : "left";
    })
    .labelOpacity(function () {
      return props.labelSide === "inside" && state.hoveredNode !== null ? 0 : 1;
    })
    .labelHitBoxSize(props.hitboxSize)
    .nameLabel(function (id) {
      return id.slice(2);
    }); // Remove the leading 'f-' or 't-' from the ids

  var linkTooltip = sszvis
    .tooltip()
    .renderInto(linkTooltipLayer)
    .header(sszvis.modularTextHTML().bold(formatValue))
    .visible(linkIsHovered);

  var nodeTooltip = sszvis
    .tooltip()
    .renderInto(nodeTooltipLayer)
    .visible(nodeIsHovered)
    .header(sszvis.modularTextHTML().bold(formatValue))
    .orientation(function (d) {
      return d.x >= bounds.innerWidth / 2 ? "right" : "left";
    })
    .dx(20);

  // Rendering

  var sankeyGroup = chartLayer.selectGroup("sankey");

  sankeyGroup.datum(state.data).call(sankeyGen);

  var nodesGroup = sankeyGroup.selectGroup("nodes");

  nodesGroup.selectAll("[data-tooltip-anchor]").call(nodeTooltip);

  var linksGroup = sankeyGroup.selectGroup("links");

  linksGroup
    .selectAll(".sszvis-link")
    .on("mouseover", actions.onLinkOver)
    .on("mouseout", actions.onLinkOut);

  linksGroup.selectAll("[data-tooltip-anchor]").call(linkTooltip);

  // Interaction

  var interactionLayer = sszvis
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
