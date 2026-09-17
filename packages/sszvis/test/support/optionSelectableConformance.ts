/**
 * The contract the `optionSelectable` controls share.
 *
 * `control/buttonGroup` and `control/select` are documented as interchangeable: a chart swaps one
 * for the other across a breakpoint and expects the same values, the same callback and the same
 * accessible name. That promise was previously written out twice, once per control, and the two
 * copies had begun to drift. It is written once here and run from both test files, so a change
 * that holds for one control but not the other fails.
 *
 * What is genuinely different stays in each control's own file: buttonGroup's roving tabindex and
 * arrow keys, its non-string values and its per-button width; select's label truncation, its
 * option-value keying and its collision warning.
 */

import { select as d3Select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import buttonGroup from "../../src/control/buttonGroup.js";
import selectMenu from "../../src/control/select.js";
import "../../src/d3-selectdiv.js";

type ChangeHandler = (event: Event, value: string) => void;

/** The configuration surface both controls expose, in the chainable form they are written in. */
interface Chainable<Self> {
  values(values: string[] | undefined): Self;
  current(current: string): Self;
  width(width: number): Self;
  change(handler: ChangeHandler): Self;
  ariaLabel(label: string): Self;
}

/** The same surface, plus the one thing a test does with a configured control. */
interface Control {
  values(values: string[] | undefined): Control;
  current(current: string): Control;
  width(width: number): Control;
  change(handler: ChangeHandler): Control;
  ariaLabel(label: string): Control;
  renderInto(container: HTMLElement): void;
}

function adapt<Self extends Chainable<Self>>(component: Self): Control {
  return {
    values: (values) => adapt(component.values(values)),
    current: (current) => adapt(component.current(current)),
    width: (width) => adapt(component.width(width)),
    change: (handler) => adapt(component.change(handler)),
    ariaLabel: (label) => adapt(component.ariaLabel(label)),
    renderInto(container) {
      // SAFETY: d3 types `call` against the selection's own datum, which a component builder
      // does not carry. Rendering an sszvis component into a selection is exactly what
      // `.call(component)` means, and every control test in this package does it this way.
      d3Select(container).call(component as never);
    },
  };
}

/** Everything the shared cases need to know about one particular control. */
export interface OptionSelectableSpec {
  /** Names the control in the test output. */
  name: string;
  /** Matches the control's own wrapper, so that a swap can be observed as a removal. */
  wrapperSelector: string;
  create(): Control;
  /** The rendered options, in order, as the user reads them. */
  optionLabels(container: HTMLElement): string[];
  /** The element that carries the control's accessible name. */
  nameTarget(container: HTMLElement): Element | null;
  /** Picks the option at `index` the way a user would, and returns the event that fired. */
  activate(container: HTMLElement, index: number): Event;
}

export const buttonGroupSpec: OptionSelectableSpec = {
  name: "buttonGroup",
  wrapperSelector: ".sszvis-control-buttonGroup",
  create: () => adapt(buttonGroup<string>()),
  optionLabels: (container) =>
    [...container.querySelectorAll(".sszvis-control-buttonGroup__item")].map(
      (button) => button.textContent ?? "",
    ),
  nameTarget: (container) => container.querySelector(".sszvis-control-buttonGroup"),
  activate(container, index) {
    const buttons = [...container.querySelectorAll(".sszvis-control-buttonGroup__item")];
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    buttons[index]?.dispatchEvent(event);
    return event;
  },
};

export const selectSpec: OptionSelectableSpec = {
  name: "select",
  wrapperSelector: ".sszvis-control-select",
  create: () => adapt(selectMenu<string>()),
  optionLabels: (container) =>
    [...container.querySelectorAll("option")].map((option) => option.textContent ?? ""),
  nameTarget: (container) => container.querySelector(".sszvis-control-select__element"),
  activate(container, index) {
    const element = container.querySelector("select");
    const option = container.querySelectorAll("option")[index];
    const event = new Event("change", { bubbles: true });
    if (element && option) {
      element.value = option.value;
      element.dispatchEvent(event);
    }
    return event;
  },
};

/**
 * Runs the shared contract for one control, and the swap against the other. Each control's test
 * file calls this once with its own spec, so a failure is reported against the control that broke
 * it.
 */
export function describeOptionSelectableConformance(
  spec: OptionSelectableSpec,
  other: OptionSelectableSpec,
) {
  describe("optionSelectable conformance", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      container.style.width = "600px";
      document.body.append(container);
    });

    afterEach(() => {
      container.remove();
      vi.restoreAllMocks();
    });

    test("should render an empty control when the values it is given have not arrived yet", () => {
      // A chart hands the control a state key that is only assigned once its data resolves, so
      // the setter is called with `undefined` rather than skipped. Never set at all, explicitly
      // `undefined`, and explicitly empty all have to render the same empty control rather
      // than throw.
      for (const configure of [
        (control: Control) => control,
        (control: Control) => control.values(undefined),
        (control: Control) => control.values([]),
      ]) {
        container.textContent = "";
        configure(spec.create().width(200)).renderInto(container);
        expect(container.querySelector(spec.wrapperSelector)).toBeTruthy();
        expect(spec.optionLabels(container)).toEqual([]);
      }
    });

    test("should carry both the shared and the control-specific class on its wrapper when rendered", () => {
      spec.create().values(["A", "B"]).current("A").renderInto(container);
      const wrapper = container.querySelector(spec.wrapperSelector);
      expect(wrapper).toBeTruthy();
      expect(wrapper?.classList.contains("sszvis-control-optionSelectable")).toBe(true);
    });

    test("should render one option per value, in order, when values are configured", () => {
      spec.create().values(["A", "B", "C"]).current("A").renderInto(container);
      expect(spec.optionLabels(container)).toEqual(["A", "B", "C"]);
    });

    test("should report the event and the chosen value when the user picks an option", () => {
      const change = vi.fn();
      spec.create().values(["A", "B", "C"]).current("A").change(change).renderInto(container);
      const event = spec.activate(container, 2);
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0]).toBe(event);
      expect(change.mock.calls[0][1]).toBe("C");
    });

    test("should leave the rendered options untouched when the user picks one and the chart ignores it", () => {
      // The control holds no state of its own: `current` is the only thing that decides what is
      // selected, so a chart that never acts on `change` sees nothing move.
      spec.create().values(["A", "B"]).current("A").change(vi.fn()).renderInto(container);
      spec.activate(container, 1);
      expect(spec.optionLabels(container)).toEqual(["A", "B"]);
      expect(spec.nameTarget(container)).toBeTruthy();
    });

    test("should call only the most recently rendered handler when the user picks an option", () => {
      const first = vi.fn();
      const second = vi.fn();
      spec.create().values(["A", "B"]).current("A").change(first).renderInto(container);
      spec.create().values(["A", "B"]).current("A").change(second).renderInto(container);
      spec.activate(container, 1);
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(expect.any(Event), "B");
    });

    test("should do nothing rather than throw when the user picks an option and no handler is configured", () => {
      spec.create().values(["A", "B"]).current("A").renderInto(container);
      expect(() => spec.activate(container, 1)).not.toThrow();
    });

    test("should update the existing control rather than add a second one when rendered again", () => {
      spec.create().values(["A", "B"]).current("A").renderInto(container);
      spec.create().values(["A", "B"]).current("A").renderInto(container);
      expect(container.querySelectorAll(spec.wrapperSelector)).toHaveLength(1);
      expect(spec.optionLabels(container)).toEqual(["A", "B"]);
    });

    test("should drop the options it no longer offers when rendered with fewer values", () => {
      spec.create().values(["A", "B", "C"]).current("A").renderInto(container);
      spec.create().values(["A"]).current("A").renderInto(container);
      expect(spec.optionLabels(container)).toEqual(["A"]);
    });

    test(`should replace a ${other.name} control when rendered into the same container`, () => {
      // Both controls join their wrapper on `.sszvis-control-optionSelectable`, keyed by the
      // control's own name, so swapping between them is a data change and the previous
      // control's DOM is removed. This is what makes them interchangeable across a breakpoint.
      other.create().values(["A", "B"]).current("A").renderInto(container);
      expect(container.querySelectorAll(other.wrapperSelector)).toHaveLength(1);

      spec.create().values(["A", "B"]).current("A").renderInto(container);
      expect(container.querySelectorAll(other.wrapperSelector)).toHaveLength(0);
      expect(container.querySelectorAll(spec.wrapperSelector)).toHaveLength(1);
      expect(spec.optionLabels(container)).toEqual(["A", "B"]);
    });

    describe("accessible name", () => {
      test("should leave the control unnamed when no ariaLabel is configured", () => {
        spec.create().values(["A", "B"]).current("A").renderInto(container);
        expect(spec.nameTarget(container)?.hasAttribute("aria-label")).toBe(false);
      });

      test("should name the control when an ariaLabel is configured", () => {
        spec.create().values(["A", "B"]).current("A").ariaLabel("Year").renderInto(container);
        expect(spec.nameTarget(container)?.getAttribute("aria-label")).toBe("Year");
      });

      test("should keep the name empty rather than drop it when an empty ariaLabel is configured", () => {
        // `??`, not `||`: an empty string is a value the caller supplied, not an absence.
        spec.create().values(["A", "B"]).current("A").ariaLabel("").renderInto(container);
        expect(spec.nameTarget(container)?.getAttribute("aria-label")).toBe("");
      });

      test("should take the name away again when a later render omits ariaLabel", () => {
        spec.create().values(["A", "B"]).current("A").ariaLabel("Year").renderInto(container);
        spec.create().values(["A", "B"]).current("A").renderInto(container);
        expect(spec.nameTarget(container)?.hasAttribute("aria-label")).toBe(false);
      });
    });
  });
}
