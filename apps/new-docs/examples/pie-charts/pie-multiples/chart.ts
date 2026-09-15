/**
 * Small multiples of pie charts, one per group.
 *
 * @category pie-charts
 */

// Magic Numbers

/** Outer diameter of a single pie in px. */
const PIE_DIAMETER = 204;
/** Gap in px between the bottom of the grid and the colour legend. */
const LEGEND_PADDING = 40;
/** Space in px left between the columns and between the rows of the grid. */
const GRID_PADDING = 30;
/** Horizontal padding in px of the grid on palm-sized screens. */
const PALM_SIDE_PADDING = 10;
const MAX_WIDTH = 3 * PIE_DIAMETER + GRID_PADDING;

// Types

type Datum = {
  group: string;
  category: string;
  value: number;
};

/**
 * One cell of the grid. `values` is the data the pie inside it is drawn from; the small
 * multiples layout writes the geometry fields onto the same object, which is why they are
 * optional here - they exist only once the layout has run.
 */
type PieGroup = {
  group: string;
  values: Datum[];
  gw?: number;
  gh?: number;
  cx?: number;
  cy?: number;
};

type Bounds = ReturnType<typeof sszvis.bounds>;

/** Where the colour legend sits, relative to the grid it belongs to. */
type LegendPosition = (bounds: Bounds, group: PieGroup) => { top: number; left: number };

type State = {
  data: Datum[];
  groups: string[];
  /** Sum per group, used as the domain of that group's angle scale. */
  totalValues: Record<string, number>;
  pieGroups: PieGroup[];
  categories: string[];
  hoveredDatum: Datum | null;
  selectedCategories: string[];
};

type Actions = {
  showTooltip: (state: State, e: Event, datum: Datum) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("rowsCols", {
    palm: [5, 1],
    lap: [3, 2],
    _: [2, 3],
  })
  .prop("colorLegendColumns", { palm: 1, _: 2 })
  .prop("bounds", {
    palm: () => {
      const bottomPadding = LEGEND_PADDING + 182 + 20;
      return {
        top: 20,
        right: PALM_SIDE_PADDING,
        bottom: bottomPadding,
        left: PALM_SIDE_PADDING,
        height: 20 + 5 * PIE_DIAMETER + 4 * GRID_PADDING + bottomPadding,
      };
    },
    lap: () => {
      const bottomPadding = LEGEND_PADDING + 98 + 20;
      return {
        top: 20,
        right: 20,
        bottom: bottomPadding,
        left: 20,
        height: 20 + 3 * PIE_DIAMETER + 2 * GRID_PADDING + bottomPadding,
      };
    },
    _: () => {
      const bottomPadding = LEGEND_PADDING + 98 + 20;
      return {
        top: 20,
        right: 20,
        bottom: bottomPadding,
        left: 20,
        height: 20 + 2 * PIE_DIAMETER + 3 * GRID_PADDING + bottomPadding,
      };
    },
  })
  .prop("legendPosition", {
    palm:
      (w: number): LegendPosition =>
      () => ({
        top: LEGEND_PADDING,
        left: (w - 2 * PALM_SIDE_PADDING) / 2 - PIE_DIAMETER / 2,
      }),
    lap: (): LegendPosition => (bounds, g) => ({
      top: LEGEND_PADDING,
      left: bounds.innerWidth / 2 - (g.cx ?? 0) - 10 - pieRadius(g),
    }),
    _:
      (w: number): LegendPosition =>
      () => ({
        top: LEGEND_PADDING,
        left: (w - 2 * PALM_SIDE_PADDING) / 2 - Math.min(w, MAX_WIDTH) / 2,
      }),
  })
  // NOTE: On palm screens the pies are too small for a tooltip to point at a slice, so
  // none is shown.
  .prop("showTooltips", { palm: false, _: true });

// Accessors

const gAcc = (d: Datum) => d.group;
const cAcc = (d: Datum) => d.category;
const vAcc = (d: Datum) => d.value;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        group: d["Gruppe"] ?? "",
        category: d["Kategorie"] ?? "",
        value: sszvis.parseNumber(d["Anzahl"]),
      }))
      .then((data) => {
        const groups = sszvis.set(data, gAcc);
        const grouped = sszvis
          .cascade<Datum>()
          .arrayBy(gAcc, (g1, g2) => groups.indexOf(g1) - groups.indexOf(g2))
          .apply<Datum[][]>(data);

        state.data = data;
        state.groups = groups;
        state.totalValues = Object.fromEntries(
          grouped.map((group, i) => [groups[i] ?? "", d3.sum(group, vAcc)]),
        );
        state.pieGroups = grouped.map((values, i) => ({ group: groups[i] ?? "", values }));
        state.categories = sszvis.set(data, cAcc);
        state.hoveredDatum = null;
        state.selectedCategories = [];
      }),

  actions: {
    // NOTE: Hovering one slice highlights every slice of the same category, across all of
    // the multiples; only the one under the cursor gets full opacity.
    showTooltip(state, _e, datum) {
      state.hoveredDatum = datum;
      state.selectedCategories = state.data
        .filter((d) => cAcc(d) === cAcc(datum))
        .map((d) => cAcc(d));
    },

    hideTooltip(state) {
      state.hoveredDatum = null;
      state.selectedCategories = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds(props.bounds, config.id);
    const gridWidth = Math.min(bounds.innerWidth, MAX_WIDTH);

    // Scales

    // NOTE: This angle scale has no domain: it is copied per multiple, and each copy takes
    // the total of its own group as its domain.
    const aScale = d3.scaleLinear().range([0, 2 * Math.PI]);

    const cScale = sszvis.scaleQual12().domain(state.categories);

    // Layers

    const chart = sszvis
      .createSvgLayer(config.id, bounds, {
        title: "Importe nach Kategorie und Gruppe",
        description: "Anteil der Warenkategorien an den Importen, je Gruppe ein Kreisdiagramm.",
      })
      .datum(state.pieGroups);

    const tooltipLayer = sszvis.createHtmlLayer(config.id, bounds);

    // Components

    const pieMaker = sszvis.pie<Datum>().fill((d) => cScale(cAcc(d)));

    // NOTE: This component generates the svg "g" tags each pie is rendered into.
    const multiplesMaker = sszvis
      .layoutSmallMultiples<PieGroup>()
      .width(gridWidth)
      .height(bounds.innerHeight)
      .paddingX(GRID_PADDING)
      .paddingY(GRID_PADDING)
      .rows(props.rowsCols[0])
      .cols(props.rowsCols[1])
      .showTitle(true)
      .titleY(-10)
      .titleLabel((d) => `Group ${d.group.replace("G", "")}`);

    const colorLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .columnWidth(gridWidth / 2)
      .columns(props.colorLegendColumns)
      .orientation("horizontal");

    const tooltip = sszvis
      .tooltip<Datum>()
      .renderInto(tooltipLayer)
      .header(cAcc)
      .body((d) => `Anzahl: ${vAcc(d)}`)
      .opacity((d) => (d.datum === state.hoveredDatum ? 1 : 0.75))
      .visible((d) => props.showTooltips && sszvis.contains(state.selectedCategories, cAcc(d)));

    // Rendering

    const pieCharts = chart
      .selectGroup("piecharts")
      .attr("transform", sszvis.translateString(bounds.innerWidth / 2 - gridWidth / 2, 0))
      .call(multiplesMaker);

    pieCharts
      .selectAll(".sszvis-multiple")
      // NOTE: The layer selections sszvis hands back are untyped, so the group element and
      // its datum are named here rather than inferred.
      .each(function (this: SVGGElement, d: PieGroup) {
        const groupScale = aScale.copy().domain([0, state.totalValues[d.group] ?? 0]);
        const pieR = pieRadius(d);

        pieMaker.radius(pieR).angle((datum) => groupScale(vAcc(datum)));

        d3.select(this)
          .selectAll(".sszvis-multiple-chart")
          .attr("transform", sszvis.translateString((d.cx ?? 0) - pieR, (d.cy ?? 0) - pieR))
          .call(pieMaker);
      });

    pieCharts.selectAll("[data-tooltip-anchor]").call(tooltip);

    const firstGroup = state.pieGroups[0];
    if (firstGroup) {
      const legendPosition = props.legendPosition(bounds, firstGroup);
      chart
        .selectGroup("colorLegend")
        .attr(
          "transform",
          sszvis.translateString(legendPosition.left, bounds.innerHeight + legendPosition.top),
        )
        .call(colorLegend);
    }

    // Interaction

    const interactionLayer = sszvis
      .panning<Datum>()
      .elementSelector(".sszvis-path")
      .on("start", actions.showTooltip)
      .on("pan", actions.showTooltip)
      .on("end", actions.hideTooltip);

    pieCharts.call(interactionLayer);
  },
});

// Helper functions

/** The pie fills its cell of the grid, so its radius is half of the shorter side. */
const pieRadius = (group: PieGroup) => Math.min(group.gw ?? 0, group.gh ?? 0) / 2;
