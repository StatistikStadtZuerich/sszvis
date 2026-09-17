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
      test("should use a single column when there are four or fewer labels", () => {
        for (const labels of [["A"], ["A", "B"], FOUR]) {
          expect(colorLegendDimensions(labels, 800).columns).toBe(1);
        }
      });

      test("should use two columns when more than four labels fit side by side", () => {
        expect(colorLegendDimensions(SIX, 2000).columns).toBe(2);
      });

      test("should fall back to one column when two would not fit", () => {
        // a container narrower than twice the widest label
        const narrow = maxLabelWidth(SIX) * 2 - 1;
        expect(colorLegendDimensions(SIX, narrow).columns).toBe(1);
      });

      test("should fit two columns when the container is exactly twice the widest label", () => {
        expect(colorLegendDimensions(SIX, maxLabelWidth(SIX) * 2).columns).toBe(2);
      });
    });

    describe("horizontal layout", () => {
      test("should float the labels on one line when they all fit", () => {
        const dims = colorLegendDimensions(FOUR, totalLabelWidth(FOUR) + 1);
        expect(dims.horizontalFloat).toBe(true);
        expect(dims.rows).toBe(1);
        expect(dims.orientation).toBeNull();
        expect(dims.columnWidth).toBeNull();
      });

      test("should stack the labels vertically when they do not fit on one line", () => {
        const dims = colorLegendDimensions(FOUR, totalLabelWidth(FOUR) - 1);
        expect(dims.horizontalFloat).toBe(false);
        expect(dims.rows).toBe(4);
        expect(dims.orientation).toBe("vertical");
      });

      test("should never float a two-column legend, however wide the container", () => {
        const dims = colorLegendDimensions(SIX, 100_000);
        expect(dims.columns).toBe(2);
        expect(dims.horizontalFloat).toBe(false);
        expect(dims.orientation).toBe("vertical");
      });
    });

    describe("rows", () => {
      test("should round the row count up when the labels do not divide evenly over the columns", () => {
        expect(colorLegendDimensions(SIX, 2000).rows).toBe(3);
        expect(colorLegendDimensions(EIGHT, 2000).rows).toBe(4);
        // an odd count leaves the last column one short
        expect(colorLegendDimensions([...SIX, "Eta"], 2000).rows).toBe(4);
      });
    });

    describe("widths", () => {
      test("should report a column width only when the legend has more than one column", () => {
        expect(colorLegendDimensions(SIX, 2000).columnWidth).toBe(maxLabelWidth(SIX));
        expect(colorLegendDimensions(FOUR, 2000).columnWidth).toBeNull();
      });

      test("should report one 40px-padded widest label per column when the labels are stacked", () => {
        expect(colorLegendDimensions(SIX, 2000).legendWidth).toBe(maxLabelWidth(SIX) * 2);
        // a stacked single column is as wide as its widest label
        expect(colorLegendDimensions(FOUR, totalLabelWidth(FOUR) - 1).legendWidth).toBe(
          maxLabelWidth(FOUR),
        );
        // and the width of a label is its text plus the 40px padding
        expect(colorLegendDimensions(["Alpha"], 2000).legendWidth).toBe(
          measureLegendLabel("Alpha") + LABEL_PADDING,
        );
      });

      test("should report the width of the whole line when the legend floats", () => {
        const dims = colorLegendDimensions(FOUR, 2000);
        expect(dims.horizontalFloat).toBe(true);
        expect(dims.legendWidth).toBe(totalLabelWidth(FOUR));
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

    test("should return a legend component, a scale and the legend width", () => {
      const layout = colorLegendLayout({ legendLabels: FOUR }, container);
      expect(typeof layout.legend).toBe("function");
      expect(layout.scale.domain()).toEqual(FOUR);
      expect(layout.legendWidth).toBe(colorLegendDimensions(FOUR, 800).legendWidth);
    });

    test("should switch to the twelve-colour scale when there are more than six labels", () => {
      const six = colorLegendLayout({ legendLabels: SIX }, container);
      const seven = colorLegendLayout({ legendLabels: [...SIX, "Eta"] }, container);
      expect(new Set(six.scale.range()).size).toBe(6);
      expect(new Set(seven.scale.range()).size).toBe(12);
    });

    test("should reserve 60px when the axis labels are horizontal", () => {
      const layout = colorLegendLayout(
        { legendLabels: FOUR, axisLabels: ["2020", "2021"] },
        container,
      );
      expect(layout.axisLabelPadding).toBe(60);
    });

    test("should reserve the widest label plus 40px when the axis labels are vertical", () => {
      const axisLabels = ["2020", "a much longer label"];
      const layout = colorLegendLayout(
        { legendLabels: FOUR, axisLabels, slant: "vertical" },
        container,
      );
      expect(layout.axisLabelPadding).toBe(40 + measureAxisLabel("a much longer label"));
    });

    test("should reserve the widest label's diagonal plus 40px when the axis labels are diagonal", () => {
      const axisLabels = ["2020", "a much longer label"];
      const widest = measureAxisLabel("a much longer label");
      const layout = colorLegendLayout(
        { legendLabels: FOUR, axisLabels, slant: "diagonal" },
        container,
      );
      expect(layout.axisLabelPadding).toBeCloseTo(40 + widest / Math.SQRT2, 9);
    });

    test("should reserve one row height per legend row and add it to the axis padding", () => {
      const layout = colorLegendLayout({ legendLabels: EIGHT }, container);
      const rows = colorLegendDimensions(EIGHT, 800).rows;
      expect(layout.legendPadding).toBe(rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT);
      expect(layout.bottomPadding).toBe(layout.axisLabelPadding + layout.legendPadding);
    });
  });

  describe("rejected and reported options", () => {
    test("should throw when the slant cannot be laid out", () => {
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
          container,
        ),
      ).toThrow(/slant/);
      container.remove();
    });

    test("should reserve the horizontal padding when the slant is null", () => {
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      const withNull = colorLegendLayout({ legendLabels: FOUR, slant: null }, container);
      expect(withNull.axisLabelPadding).toBe(60);
      container.remove();
    });

    test("should warn and recycle the colours when there are more labels than the scale has", () => {
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

    test("should not warn when the labels fit the scale", () => {
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
    test("should report a zero-width legend when the label list is empty", () => {
      const dims = colorLegendDimensions([], 800);
      expect(dims.legendWidth).toBe(0);
      expect(dims.rows).toBe(1);
      expect(dims.horizontalFloat).toBe(true);
    });

    test("should reserve only the 40px base padding when a slanted axis has no labels", () => {
      const container = document.createElement("div");
      container.style.width = "800px";
      document.body.append(container);
      const layout = colorLegendLayout({ legendLabels: FOUR, slant: "vertical" }, container);
      expect(layout.axisLabelPadding).toBe(40);
      expect(layout.bottomPadding).toBe(40 + layout.legendPadding);
      container.remove();
    });

    test("should warn when the container cannot be measured", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const detached = document.createElement("div");
      colorLegendLayout({ legendLabels: EIGHT }, detached);
      expect(warn).toHaveBeenCalled();

      warn.mockClear();
      colorLegendLayout({ legendLabels: EIGHT }, "#no-such-container");
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    test("should lay out a single vertical column when the container cannot be measured", () => {
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
  });
});
