/**
 * Zoomable treemap example using sszvis.
 *
 * @sszvis   3.5.1
 * @chart    treemap
 * @features tooltip, legend, breadcrumb
 * @date     2026-09-14
 */

// Magic Numbers

/** Minimum height in px of the treemap area itself, before the legend is added. */
const MIN_CHART_HEIGHT = 650;
/** Vertical space in px the legend and the outer padding need below the treemap. */
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
  /** The hierarchy currently drawn: the whole tree, or the subtree below `focusedNode`. */
  data: TreeNode;
  /** The full hierarchy, kept so that a zoom can be resolved against the original nodes. */
  originalData: TreeNode;
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
      bottom: 10,
      right: 0,
      height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + CHART_HEIGHT_PADDING),
    }),
    _: (w: number) => ({
      top: 50,
      left: 20,
      bottom: 10,
      right: 20,
      height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + CHART_HEIGHT_PADDING),
    }),
  })
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
        const hierarchy = sszvis
          .prepareHierarchyData<Datum>()
          .layer(categoryAcc)
          .layer(subcategoryAcc)
          .layer(divisionAcc)
          .layer(teamAcc)
          .value(valueAcc)
          .calculate(data);

        state.originalData = hierarchy;
        state.focusedNode = null;
        state.data = hierarchy;
        state.categories = sszvis.set(data, categoryAcc);
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
      const originalNode = findByKey(state.originalData, node.data);
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
      state.data = buildDisplayData(state.originalData, zoomTarget);
      state.selection = [];
    },

    focusNode(state, node) {
      state.focusedNode = node;
      state.data = buildDisplayData(state.originalData, node);
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

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

    const treemap = sszvis
      .treemap<Datum>()
      .containerWidth(bounds.innerWidth)
      // NOTE: The legend sits below the treemap, inside the same inner height.
      .containerHeight(bounds.innerHeight - legendLayout.bottomPadding)
      .colorScale(colorScale)
      .showLabels(true)
      .label((d) => keyAcc(d.data))
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

    chartLayer.selectGroup("treemap").datum(state.data).call(treemap);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("colorLegend")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight - legendLayout.bottomPadding))
      .call(colorLegend);

    htmlLayer.call(breadcrumbNav);

    // Interaction

    const interactionLayer = sszvis
      .panning<TreeNode>()
      .elementSelector(".sszvis-treemap-rect")
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
 * and on the layer key as a fallback, is what connects a clicked rectangle back to the
 * node whose children the zoom needs.
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

/**
 * Builds the hierarchy shown for the currently focused node. The nodes it produces are
 * cached on the state because the tooltip identifies its datum by reference: rebuilding
 * the hierarchy on every render would hand the treemap new node objects and drop the
 * selection made by the panning behavior.
 */
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
