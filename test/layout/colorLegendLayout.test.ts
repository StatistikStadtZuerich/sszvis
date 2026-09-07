import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { colorLegendDimensions, colorLegendLayout } from "../../src/layout/colorLegendLayout.js";
import { DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT } from "../../src/legend/ordinalColorScale.js";
import { measureAxisLabel, measureLegendLabel } from "../../src/measure.js";

// Label widths are measured with the real text metrics, so expectations are derived from
// the same measurement rather than hard-coded pixels.
const LABEL_PADDING = 40;
const labelWidth = (label: string) => measureLegendLabel(label) + LABEL_PADDING;
const maxLabelWidth = (labels: string[]) => Math.max(...labels.map(labelWidth));
const totalLabelWidth = (labels: string[]) =>
  labels.reduce((acc, label) => acc + labelWidth(label), 0);

const FOUR = ["Alpha", "Beta", "Gamma", "Delta"];
const SIX = [...FOUR, "Epsilon", "Zeta"];
const EIGHT = [...SIX, "Eta", "Theta"];

describe("colorLegendLayout", () => {
  describe("colorLegendDimensions", () => {
    describe("columns", () => {
      test("uses a single column for four or fewer labels", () => {
        for (const labels of [["A"], ["A", "B"], FOUR]) {
          expect(colorLegendDimensions(labels, 800).columns).toBe(1);
        }
      });

      test("uses two columns for more than four labels when they fit", () => {
        expect(colorLegendDimensions(SIX, 2000).columns).toBe(2);
      });

      test("falls back to one column when two would not fit", () => {
        // a container narrower than twice the widest label
        const narrow = maxLabelWidth(SIX) * 2 - 1;
        expect(colorLegendDimensions(SIX, narrow).columns).toBe(1);
      });

      test("fits exactly two columns at twice the widest label", () => {
        expect(colorLegendDimensions(SIX, maxLabelWidth(SIX) * 2).columns).toBe(2);
      });
    });

    describe("horizontal layout", () => {
      test("floats the labels on one line when they all fit", () => {
        const dims = colorLegendDimensions(FOUR, totalLabelWidth(FOUR) + 1);
        expect(dims.horizontalFloat).toBe(true);
        expect(dims.rows).toBe(1);
        expect(dims.orientation).toBeNull();
        expect(dims.columnWidth).toBeNull();
      });

      test("stacks the labels vertically when they do not fit on one line", () => {
        const dims = colorLegendDimensions(FOUR, totalLabelWidth(FOUR) - 1);
        expect(dims.horizontalFloat).toBe(false);
        expect(dims.rows).toBe(4);
        expect(dims.orientation).toBe("vertical");
      });

      test("never floats a two-column legend, however wide the container", () => {
        const dims = colorLegendDimensions(SIX, 100_000);
        expect(dims.columns).toBe(2);
        expect(dims.horizontalFloat).toBe(false);
        expect(dims.orientation).toBe("vertical");
      });
    });

    describe("rows", () => {
      test("splits the labels over the columns, rounding up", () => {
        expect(colorLegendDimensions(SIX, 2000).rows).toBe(3);
        expect(colorLegendDimensions(EIGHT, 2000).rows).toBe(4);
        // an odd count leaves the last column one short
        expect(colorLegendDimensions([...SIX, "Eta"], 2000).rows).toBe(4);
      });
    });

    describe("widths", () => {
      test("reports the column width only for a multi-column legend", () => {
        expect(colorLegendDimensions(SIX, 2000).columnWidth).toBe(maxLabelWidth(SIX));
        expect(colorLegendDimensions(FOUR, 2000).columnWidth).toBeNull();
      });

      test("legendWidth is the column count times the widest label", () => {
        expect(colorLegendDimensions(SIX, 2000).legendWidth).toBe(maxLabelWidth(SIX) * 2);
        expect(colorLegendDimensions(FOUR, 2000).legendWidth).toBe(maxLabelWidth(FOUR));
      });

      test("every label is padded by 40px", () => {
        const one = colorLegendDimensions(["Alpha"], 2000);
        expect(one.legendWidth).toBe(measureLegendLabel("Alpha") + LABEL_PADDING);
      });
    });
  });

  describe("colorLegendLayout", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      container.id = "legend-layout-container";
      container.style.width = "800px";
      document.body.append(container);
    });

    afterEach(() => {
      container.remove();
    });

    test("returns a legend component, a scale and the paddings", () => {
      const layout = colorLegendLayout({ legendLabels: FOUR }, container);
      expect(typeof layout.legend).toBe("function");
      expect(layout.scale.domain()).toEqual(FOUR);
      expect(layout.legendWidth).toBe(colorLegendDimensions(FOUR, 800).legendWidth);
    });

    test("uses the six-colour scale up to six labels and the twelve-colour scale beyond", () => {
      const six = colorLegendLayout({ legendLabels: SIX }, container);
      const seven = colorLegendLayout({ legendLabels: [...SIX, "Eta"] }, container);
      expect(new Set(six.scale.range()).size).toBe(6);
      expect(new Set(seven.scale.range()).size).toBe(12);
    });

    test("reserves 60px for horizontal axis labels", () => {
      const layout = colorLegendLayout(
        { legendLabels: FOUR, axisLabels: ["2020", "2021"] },
        container
      );
      expect(layout.axisLabelPadding).toBe(60);
    });

    test("reserves the widest label plus 40px for vertical axis labels", () => {
      const axisLabels = ["2020", "a much longer label"];
      const layout = colorLegendLayout(
        { legendLabels: FOUR, axisLabels, slant: "vertical" },
        container
      );
      expect(layout.axisLabelPadding).toBe(40 + measureAxisLabel("a much longer label"));
    });

    test("reserves the diagonal of the widest label for diagonal axis labels", () => {
      const axisLabels = ["2020", "a much longer label"];
      const widest = measureAxisLabel("a much longer label");
      const layout = colorLegendLayout(
        { legendLabels: FOUR, axisLabels, slant: "diagonal" },
        container
      );
      expect(layout.axisLabelPadding).toBeCloseTo(40 + widest / Math.SQRT2, 9);
    });

    test("legendPadding is one row height per row", () => {
      const layout = colorLegendLayout({ legendLabels: EIGHT }, container);
      const rows = colorLegendDimensions(EIGHT, 800).rows;
      expect(layout.legendPadding).toBe(rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT);
    });

    test("bottomPadding is the sum of the axis and legend paddings", () => {
      const layout = colorLegendLayout({ legendLabels: EIGHT }, container);
      expect(layout.bottomPadding).toBe(layout.axisLabelPadding + layout.legendPadding);
    });
  });

  describe("rejected and reported options", () => {
    test("rejects a slant it cannot lay out", () => {
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      expect(() =>
        colorLegendLayout(
          {
            legendLabels: FOUR,
            axisLabels: ["2020"],
            slant: "sideways" as unknown as "vertical",
          },
          container
        )
      ).toThrow(/slant/);
      container.remove();
    });

    test("treats an omitted or null slant as horizontal", () => {
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      const withNull = colorLegendLayout({ legendLabels: FOUR, slant: null }, container);
      expect(withNull.axisLabelPadding).toBe(60);
      container.remove();
    });

    test("warns when there are more labels than the scale has colours", () => {
      // d3's ordinal scale recycles its range rather than running out, so labels 13 and up
      // repeat the colours of labels 1 and up
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const many = Array.from({ length: 14 }, (_, i) => `Label ${i}`);
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      const layout = colorLegendLayout({ legendLabels: many }, container);
      const colors = many.map((label) => layout.scale(label));
      expect(new Set(colors).size).toBe(12);
      expect(warn).toHaveBeenCalled();
      container.remove();
      warn.mockRestore();
    });

    test("says nothing when the labels fit the scale", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      colorLegendLayout({ legendLabels: EIGHT }, container);
      expect(warn).not.toHaveBeenCalled();
      container.remove();
      warn.mockRestore();
    });
  });

  describe("degenerate inputs", () => {
    test("an empty label list gives a zero-width legend", () => {
      const dims = colorLegendDimensions([], 800);
      expect(dims.legendWidth).toBe(0);
      expect(dims.rows).toBe(1);
      expect(dims.horizontalFloat).toBe(true);
    });

    test("a vertical or diagonal slant with no axis labels reserves only the base padding", () => {
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      const layout = colorLegendLayout({ legendLabels: FOUR, slant: "vertical" }, container);
      expect(layout.axisLabelPadding).toBe(40);
      expect(layout.bottomPadding).toBe(40 + layout.legendPadding);
      container.remove();
    });

    test("warns when the container cannot be measured", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const detached = document.createElement("div");
      colorLegendLayout({ legendLabels: EIGHT }, detached);
      expect(warn).toHaveBeenCalled();

      warn.mockClear();
      colorLegendLayout({ legendLabels: EIGHT }, "#no-such-container");
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("lays an unmeasurable container out as a single vertical column", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const detached = document.createElement("div");
      const layout = colorLegendLayout({ legendLabels: EIGHT }, detached);
      expect(layout.legendPadding).toBe(EIGHT.length * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT);
      expect(colorLegendDimensions(EIGHT, 0)).toMatchObject({
        columns: 1,
        rows: 8,
        horizontalFloat: false,
      });
      warn.mockRestore();
    });
  });

  describe("known quirks", () => {
    test("the column count is capped at two", () => {
      // NOTE: intended - numCols starts from DEFAULT_COLUMN_COUNT = 2 and only ever counts
      // down. A very wide container with many short labels still gets two columns.
      const dims = colorLegendDimensions(EIGHT, 100_000);
      expect(dims.columns).toBe(2);
      expect(dims.rows).toBe(4);
    });

    test("legendWidth ignores the horizontal layout it describes", () => {
      // BUG: for a floated single-column legend the labels are laid out on one line, but
      // legendWidth still reports the width of the widest label alone. A caller sizing the
      // chart from legendWidth under-reserves the space the legend actually occupies.
      // got: legendWidth === widest label
      // want: the width of the floated line.
      const dims = colorLegendDimensions(FOUR, 2000);
      expect(dims.horizontalFloat).toBe(true);
      expect(dims.legendWidth).toBe(maxLabelWidth(FOUR));
      expect(dims.legendWidth).toBeLessThan(totalLabelWidth(FOUR));
    });
  });
});
