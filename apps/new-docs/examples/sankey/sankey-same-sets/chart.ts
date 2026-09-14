/**
 * Sankey diagram between two sets drawn from the same nodes.
 *
 * @category sankey
 */

// Magic Numbers

/** Minimum height in px of the diagram itself, before padding. */
const MIN_CHART_HEIGHT = 650;
/** Vertical space in px the column labels and the outer padding need. */
const CHART_HEIGHT_PADDING = 60;
/** How far in px an inside column label is pushed away from its column. */
const INSIDE_LABEL_OFFSET = 28;
/** Horizontal gap in px between a node and its tooltip. */
const TOOLTIP_GUTTER = 20;

// Types

/**
 * Mirrors the library's `SankeyNode` and `SankeyLink`: `sankeyPrepareData` produces these
 * shapes, but the types are not re-exported from the `sszvis` entry point, so examples have
 * to restate them.
 */
type SankeyNode = {
  id: string;
  columnIndex: number;
  nodeIndex: number;
  value: number;
  valueOffset: number;
  linksFrom?: SankeyLink[];
  linksTo?: SankeyLink[];
};

type SankeyLink = {
  id: number;
  value: number;
  src: SankeyNode;
  srcOffset: number;
  tgt: SankeyNode;
  tgtOffset: number;
};

type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  columnTotals: number[];
  columnLengths: number[];
};

type Datum = {
  source: string;
  target: string;
  value: number;
};

type State = {
  data: SankeyData;
  hoveredNode: SankeyNode | null;
  hoveredLink: SankeyLink | null;
  linkSourceLabels: SankeyLink[];
  linkTargetLabels: SankeyLink[];
};

type Actions = {
  showNodeTooltip: (state: State, e: Event, node: SankeyNode) => void;
  hideNodeTooltip: (state: State) => void;
  showLinkTooltip: (state: State, e: Event, link: SankeyLink) => void;
  hideLinkTooltip: (state: State) => void;
};

// Responsive Props

// NOTE: The left and right padding are chosen so that there is room for the outside labels
// on either side. Measuring them per render would be far more expensive than reserving a
// quarter of the width; sszvis.sankeyLayout lines the node bars up with the edges of the
// remaining space, so the labels land in the padding.
const queryProps = sszvis
  .responsiveProps()
  .prop("bounds", {
    palm: (w: number) => ({
      top: 40,
      left: 0,
      bottom: 20,
      right: 0,
      height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + CHART_HEIGHT_PADDING),
    }),
    _: (w: number) => ({
      top: 40,
      left: w / 4,
      bottom: 20,
      right: w / 4,
      height: Math.max(sszvis.aspectRatio4to3(w), MIN_CHART_HEIGHT + CHART_HEIGHT_PADDING),
    }),
  })
  .prop("labelSide", { palm: "inside", _: "outside" })
  .prop("hitboxSize", { palm: 60, _: 120 });

// Accessors

const sourceAcc = (d: Datum) => d.source;
const targetAcc = (d: Datum) => d.target;
const valueAcc = (d: Datum) => d.value;
const flowAcc = (d: SankeyNode | SankeyLink) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        source: d["source"] ?? "",
        target: d["target"] ?? "",
        value: sszvis.parseNumber(d["value"] ?? ""),
      }))
      .then((data) => {
        state.data = sszvis
          .sankeyPrepareData<Datum>()
          .source(sourceAcc)
          .target(targetAcc)
          .value(valueAcc)
          .idLists([sszvis.set(data, sourceAcc), sszvis.set(data, targetAcc)])
          .apply(data);

        state.hoveredNode = null;
        state.hoveredLink = null;
        state.linkSourceLabels = [];
        state.linkTargetLabels = [];
      }),

  actions: {
    // NOTE: Hovering a node labels every link that touches it, on the side it comes from.
    showNodeTooltip(state, _e, node) {
      state.hoveredNode = node;
      state.linkSourceLabels = node.linksTo ?? [];
      state.linkTargetLabels = node.linksFrom ?? [];
      state.hoveredLink = null;
    },

    hideNodeTooltip(state) {
      state.hoveredNode = null;
      state.linkSourceLabels = [];
      state.linkTargetLabels = [];
      state.hoveredLink = null;
    },

    showLinkTooltip(state, _e, link) {
      state.hoveredLink = link;
      state.hoveredNode = null;
    },

    hideLinkTooltip(state) {
      state.hoveredLink = null;
      state.hoveredNode = null;
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);

    // NOTE: sankeyLayout computes the visual dimensions of the diagram - the pixels per unit,
    // and the domain and range of the scales below. The height and width arguments are
    // swapped for a horizontal orientation.
    const sankeyLayout = sszvis.sankeyLayout(
      state.data.columnLengths,
      state.data.columnTotals,
      bounds.innerHeight,
      bounds.innerWidth,
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

    const cScale = sszvis.scaleQual12();
    const nodeColor = cScale.range()[0];
    const highlightLinkColor = cScale.range()[1];
    const linkColor = sszvis.scalePaleGry()(0);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, bounds, {
      title: "Umzüge zwischen den Stadtquartieren",
      description: "Umzüge innerhalb der Stadt, vom Auszugs- ins Einzugsquartier.",
    });

    const linkTooltipLayer = sszvis.createHtmlLayer(config.id, bounds, { key: "linkTooltipLayer" });
    const nodeTooltipLayer = sszvis.createHtmlLayer(config.id, bounds, { key: "nodeTooltipLayer" });

    // Components

    const formatValue = (d: SankeyNode | SankeyLink) => sszvis.formatPreciseNumber(0, flowAcc(d));
    const isHighlighted = linkIsSelected(state);

    const sankeyGen = sszvis
      .sankey()
      .sizeScale(valueScale)
      .columnPosition(columnPosition)
      .columnLabel((columnIndex) => ["Auszugsquartier", "Einzugsquartier"][columnIndex] ?? "")
      .nodeThickness(sankeyLayout.nodeThickness)
      .nodePadding(sankeyLayout.nodePadding)
      .columnPadding((columnIndex) => sankeyLayout.columnPaddings[columnIndex] ?? 0)
      .columnLabelOffset((_d, i) => {
        if (props.labelSide !== "inside") {
          return 0;
        }
        return i === 0 ? INSIDE_LABEL_OFFSET : -INSIDE_LABEL_OFFSET;
      })
      .nodeColor(nodeColor)
      .linkColor((d: SankeyLink) => (isHighlighted(d) ? highlightLinkColor : linkColor))
      .linkSort((a: SankeyLink, b: SankeyLink) =>
        isHighlighted(a) ? 1 : isHighlighted(b) ? -1 : flowAcc(a) - flowAcc(b),
      )
      .linkSourceLabels(state.linkSourceLabels)
      .linkTargetLabels(state.linkTargetLabels)
      .linkLabel(formatValue)
      .labelSideSwitch(props.labelSide === "inside")
      .labelSide((columnIndex) =>
        columnPosition(columnIndex) > bounds.innerWidth / 2 ? "right" : "left",
      )
      // NOTE: Inside labels would collide with the tooltip, so they are hidden while a node
      // is hovered.
      .labelOpacity(() => (props.labelSide === "inside" && state.hoveredNode !== null ? 0 : 1))
      .labelHitBoxSize(props.hitboxSize)
      // NOTE: The same quartier appears in both columns, so the ids are prefixed with "f-"
      // and "t-" to keep them distinct; the label drops the prefix again.
      .nameLabel((id) => id.slice(2));

    const linkTooltip = sszvis
      .tooltip<SankeyLink>()
      .renderInto(linkTooltipLayer)
      .header(sszvis.modularTextHTML().bold(formatValue))
      .visible((d) => state.hoveredLink === d);

    const nodeTooltip = sszvis
      .tooltip<SankeyNode>()
      .renderInto(nodeTooltipLayer)
      .visible((d) => state.hoveredNode === d)
      .header(sszvis.modularTextHTML().bold(formatValue))
      .orientation((d) => (d.x >= bounds.innerWidth / 2 ? "right" : "left"))
      .dx(TOOLTIP_GUTTER);

    // Rendering

    const sankeyGroup = chartLayer.selectGroup("sankey");

    sankeyGroup.datum(state.data).call(sankeyGen);

    sankeyGroup.selectGroup("nodes").selectAll("[data-tooltip-anchor]").call(nodeTooltip);

    const linksGroup = sankeyGroup.selectGroup("links");

    linksGroup
      .selectAll(".sszvis-link")
      .on("mouseover", actions.showLinkTooltip)
      .on("mouseout", actions.hideLinkTooltip);

    linksGroup.selectAll("[data-tooltip-anchor]").call(linkTooltip);

    // Interaction

    const interactionLayer = sszvis
      .panning<SankeyNode>()
      .elementSelector(".sszvis-sankey-hitbox")
      .on("start", actions.showNodeTooltip)
      .on("pan", actions.showNodeTooltip)
      .on("end", actions.hideNodeTooltip);

    sankeyGroup.selectGroup("nodelabels").call(interactionLayer);
  },
});

// Helper functions

/** A link is highlighted when it is hovered itself, or when either of its nodes is. */
const linkIsSelected = (state: State) => (d: SankeyLink) =>
  state.hoveredLink === d || state.hoveredNode === d.src || state.hoveredNode === d.tgt;
