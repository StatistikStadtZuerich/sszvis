/* global d3, sszvis, config */

// Configuration
// -----------------------------------------------

const MIN_CHART_HEIGHT = 650;
const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    palm: (w) => ({
      top: 50,
      left: 0,
      bottom: 20,
      right: 0,
      height: Math.max(sszvis.aspectRatioSquare(w), MIN_CHART_HEIGHT),
    }),
    _: (w) => ({
      top: 50,
      left: 20,
      bottom: 20,
      right: 20,
      height: Math.max(sszvis.aspectRatioSquare(w), MIN_CHART_HEIGHT + 40 + 20),
    }),
  })
  .prop("minRadius", {
    _: 5,
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
    category: d["category"],
    subcategory: d["subcategory"],
    division: d["division"] || null,
    team: d["team"] || null,
    value: sszvis.parseNumber(d["value"]),
  };
}

const categoryAcc = sszvis.prop("category");
const subcategoryAcc = sszvis.prop("subcategory");
const divisionAcc = sszvis.prop("division");
const teamAcc = sszvis.prop("team");
const valueAcc = sszvis.prop("value");

// Application state
// -----------------------------------------------
const state = {
  data: [],
  categories: [],
  selection: [],
  focusedNode: null,
  originalData: null,
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    // Prepare data for pack (using new API without hardcoded size)
    state.originalData = sszvis
      .prepareHierarchyData()
      .layer(categoryAcc)
      .layer(subcategoryAcc)
      .layer(divisionAcc)
      .layer(teamAcc)
      .value(valueAcc)
      .calculate(data);

    state.data = state.originalData;
    state.categories = Array.from(new Set(data.map(categoryAcc)));
    state.focusedNode = null;
    render(state);
  },

  onRectangleOver(_, d) {
    state.selection = [d];
    render(state);
  },

  onRectangleOut() {
    state.selection = [];
    render(state);
  },

  onNodeClick(_, node) {
    // Helper to find a node in the original hierarchy by matching data
    const findOriginalNode = (targetData) => {
      let found = null;
      state.originalData.each((n) => {
        if (n.data === targetData || n.data.key === targetData.key) {
          found = n;
        }
      });
      return found;
    };

    const originalNode = findOriginalNode(node.data);
    if (!originalNode) {
      return;
    }

    let zoomTarget;
    if (originalNode.children && originalNode.children.length > 0) {
      zoomTarget = originalNode;
    } else {
      const parent = originalNode.parent;
      if (parent?.data._tag === "root" && state.focusedNode === parent) {
        return;
      }
      zoomTarget = parent;
    }

    state.focusedNode = zoomTarget;
    state.selection = []; // Clear tooltip on zoom
    render(state);
  },

  onBreadcrumbClick(node) {
    state.focusedNode = node;
    state.selection = [];
    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv(config.data, parseRow)
  .then(actions.prepareState)
  .catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (!state.data) return;

  const props = queryProps(sszvis.measureDimensions(config.id));
  const bounds = sszvis.bounds(props.bounds, config.id);

  const legendLayout = sszvis.colorLegendLayout(
    {
      axisLabels: state.categories,
      legendLabels: state.categories,
    },
    config.id,
  );

  const colorScale = legendLayout.scale;
  const colorLegend = legendLayout.legend;

  const displayData = state.focusedNode
    ? d3
        .hierarchy(state.focusedNode.data, (d) => {
          if (d._tag !== "root" && d._tag !== "branch") {
            return null;
          }
          const findNode = (root, targetData) => {
            if (root.data === targetData) return root;
            if (!root.children) {
              return null;
            }
            for (const child of root.children) {
              const found = findNode(child, targetData);
              if (found) return found;
            }
          };
          return findNode(state.originalData, d)?.children?.map((c) => c.data);
        })
        .sum((d) => (d._tag === "leaf" ? valueAcc(d.data) : 0))
    : state.originalData;

  // Build breadcrumb trail using the helper function
  const breadcrumbItems = sszvis.createBreadcrumbItems(state.focusedNode);

  // Layers
  const chartLayer = sszvis.createSvgLayer(config.id, bounds);
  const htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

  // Components
  const pack = sszvis
    .pack()
    .containerWidth(bounds.innerWidth)
    .containerHeight(bounds.innerHeight - legendLayout.bottomPadding) // Leave space for legend
    .colorScale(colorScale)
    .showLabels(true)
    .label((d) => d.data.key)
    .minRadius(props.minRadius)
    .onClick(actions.onNodeClick);

  const tooltipHeaderText = sszvis.modularTextHTML().bold((d) => d.data.key);
  const tooltipBodyText = sszvis
    .modularTextHTML()
    .plain((d) => "Value: " + sszvis.formatNumber(d.value));

  const tooltip = sszvis
    .tooltip()
    .renderInto(htmlLayer)
    .header(tooltipHeaderText)
    .body(tooltipBodyText)
    .orientation(sszvis.fitTooltip("bottom", bounds))
    .visible(isSelected);

  // Rendering
  chartLayer.selectGroup("pack").datum(displayData).call(pack);

  chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

  chartLayer
    .selectGroup("colorLegend")
    .attr(
      "transform",
      sszvis.translateString(
        (bounds.innerWidth - legendLayout.legendWidth) / 2,
        bounds.innerHeight - legendLayout.bottomPadding,
      ),
    )
    .call(colorLegend);

  // Render breadcrumbs using the new component
  const breadcrumbNav = sszvis
    .breadcrumb()
    .renderInto(htmlLayer)
    .items(breadcrumbItems)
    .width(bounds.innerWidth)
    .onClick((item) => actions.onBreadcrumbClick(item.node));

  htmlLayer.call(breadcrumbNav);

  // Interaction
  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-pack-circle")
    .on("start", actions.onRectangleOver)
    .on("pan", actions.onRectangleOver)
    .on("end", actions.onRectangleOut);

  chartLayer.call(interactionLayer);

  sszvis.viewport.on("resize", actions.resize);
}

function isSelected(d) {
  return state.selection.includes(d);
}
