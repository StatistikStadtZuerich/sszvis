/**
 * Zoomable circle packing example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    pack
 * @features tooltip, breadcrumb
 * @date     2026-09-14
 */

// Magic Numbers

/** Minimum height in px of the packing area itself, before the legend is added. */
const MIN_CHART_HEIGHT = 650;
/** Vertical space in px the legend and the outer padding need below the circles. */
const CHART_HEIGHT_PADDING = 60;

// Types

type Datum = {
  category: string;
  subcategory: string;
  division: string | null;
  team: string | null;
  value: number;
};

/**
 * Mirrors the library's `NodeDatum`: `prepareHierarchyData` wraps every row in this
 * discriminated union, but the type itself is not re-exported from the `sszvis` entry
 * point, so examples have to restate its shape.
 */
type HierarchyDatum =
  | { _tag: "root"; children: HierarchyDatum[] }
  | { _tag: "branch"; key: string; rootKey: string; children: HierarchyDatum[] }
  | { _tag: "leaf"; key: string; rootKey: string; data: Datum };

type TreeNode = import("d3").HierarchyNode<HierarchyDatum>;

type State = {
  /** The full hierarchy; the drawn subtree is derived from it and `focusedNode`. */
  data: TreeNode;
  categories: string[];
  selection: TreeNode[];
  focusedNode: TreeNode | null;
};

type Actions = {
  showTooltip: (state: State, e: Event, node: TreeNode) => void;
  hideTooltip: (state: State) => void;
  zoomToNode: (state: State, e: MouseEvent, node: TreeNode) => void;
  focusNode: (state: State, node: TreeNode | null) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    palm: (w: number) => ({
      top: 50,
      left: 0,
      bottom: 20,
      right: 0,
      height: Math.max(sszvis.aspectRatioSquare(w), MIN_CHART_HEIGHT),
    }),
    _: (w: number) => ({
      top: 50,
      left: 20,
      bottom: 20,
      right: 20,
      height: Math.max(sszvis.aspectRatioSquare(w), MIN_CHART_HEIGHT + CHART_HEIGHT_PADDING),
    }),
  })
  .prop("minRadius", { _: 5 })
  .prop("labelSide", { palm: "inside", _: "outside" })
  .prop("hitboxSize", { palm: 60, _: 120 });

// Accessors

const categoryAcc = (d: Datum) => d.category;
const subcategoryAcc = (d: Datum) => d.subcategory;
const divisionAcc = (d: Datum) => d.division;
const teamAcc = (d: Datum) => d.team;
const valueAcc = (d: Datum) => d.value;
const keyAcc = (d: HierarchyDatum) => ("key" in d ? d.key : "");

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["category"] ?? "",
        subcategory: d["subcategory"] ?? "",
        division: d["division"] || null,
        team: d["team"] || null,
        value: sszvis.parseNumber(d["value"]),
      }))
      .then((data) => {
        state.data = sszvis
          .prepareHierarchyData<Datum>()
          .layer(categoryAcc)
          .layer(subcategoryAcc)
          .layer(divisionAcc)
          .layer(teamAcc)
          .value(valueAcc)
          .calculate(data);

        state.categories = sszvis.set(data, categoryAcc);
        state.focusedNode = null;
        state.selection = [];
      }),

  actions: {
    showTooltip(state, _e, node) {
      state.selection = [node];
    },

    hideTooltip(state) {
      state.selection = [];
    },

    // NOTE: Clicking a leaf zooms out to its parent, clicking a branch zooms into it.
    // A leaf directly below the current root has nowhere further to go, so it is ignored.
    zoomToNode(state, _e, node) {
      const originalNode = findByKey(state.data, node.data);
      if (!originalNode) {
        return;
      }

      let zoomTarget: TreeNode | null;
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
      state.selection = [];
    },

    focusNode(state, node) {
      state.focusedNode = node;
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);
    const displayData = buildDisplayData(state.data, state.focusedNode);

    // Scales

    const legendLayout = sszvis.colorLegendLayout(
      { axisLabels: state.categories, legendLabels: state.categories },
      config.id,
    );
    const colorScale = legendLayout.scale;

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Personalbestand nach Bereich",
      description: "Hierarchie der Bereiche, Abteilungen und Teams, flächenproportional.",
    });

    const htmlLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    const pack = sszvis
      .pack<Datum>()
      .containerWidth(bounds.innerWidth)
      // NOTE: The legend sits below the circles, inside the same inner height.
      .containerHeight(bounds.innerHeight - legendLayout.bottomPadding)
      .colorScale(colorScale)
      .showLabels(true)
      .label((d) => keyAcc(d.data))
      .minRadius(props.minRadius)
      .onClick(actions.zoomToNode);

    const colorLegend = legendLayout.legend;

    const breadcrumbNav = sszvis
      .breadcrumb<Datum>()
      .renderInto(htmlLayer)
      .items(sszvis.createBreadcrumbItems(state.focusedNode))
      .width(bounds.innerWidth)
      .onClick((item) => {
        actions.focusNode(item.node);
      });

    const tooltipHeaderText = sszvis.modularTextHTML().bold((d: TreeNode) => keyAcc(d.data));

    const tooltipBodyText = sszvis
      .modularTextHTML()
      .plain((d: TreeNode) => `Value: ${sszvis.formatNumber(d.value)}`);

    const tooltip = sszvis
      .tooltip<TreeNode>()
      .renderInto(htmlLayer)
      .header(tooltipHeaderText)
      .body(tooltipBodyText)
      .orientation(sszvis.fitTooltip("bottom", bounds))
      .visible((d) => sszvis.contains(state.selection, d));

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

    htmlLayer.call(breadcrumbNav);

    // Interaction

    const interactionLayer = sszvis
      .panning<TreeNode>()
      .elementSelector(".sszvis-pack-circle")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    chartLayer.call(interactionLayer);
  },
});

// Helper functions

/**
 * Finds the node of the full hierarchy that carries this datum. The zoomed hierarchy is
 * rebuilt from the original data, so its nodes are new objects; matching on the datum,
 * and on the layer key as a fallback, is what connects a clicked circle back to the node
 * whose children the zoom needs.
 */
const findByKey = (root: TreeNode, target: HierarchyDatum): TreeNode | null => {
  let found: TreeNode | null = null;
  root.each((node) => {
    if (node.data === target || keyAcc(node.data) === keyAcc(target)) {
      found = node;
    }
  });
  return found;
};

/** The subtree below the focused node, re-summed so the packing fills the container. */
const buildDisplayData = (originalData: TreeNode, focusedNode: TreeNode | null): TreeNode => {
  if (!focusedNode) {
    return originalData;
  }

  const findNode = (root: TreeNode, targetData: HierarchyDatum): TreeNode | null => {
    if (root.data === targetData) {
      return root;
    }
    if (!root.children) {
      return null;
    }
    for (const child of root.children) {
      const found = findNode(child, targetData);
      if (found) {
        return found;
      }
    }
    return null;
  };

  return d3
    .hierarchy(focusedNode.data, (d) => {
      if (d._tag !== "root" && d._tag !== "branch") {
        return null;
      }
      return findNode(originalData, d)?.children?.map((c) => c.data);
    })
    .sum((d) => (d._tag === "leaf" ? valueAcc(d.data) : 0));
};
