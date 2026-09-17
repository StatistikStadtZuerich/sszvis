import { select as d3Select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import buttonGroup from "../../src/control/buttonGroup.js";
import {
  buttonGroupSpec,
  describeOptionSelectableConformance,
  selectSpec,
} from "../support/optionSelectableConformance.js";
import "../../src/d3-selectdiv.js";

// The promises this control shares with `control/select` - values coercion, the wrapper class,
// the change callback, the accessible name, re-rendering and the swap between the two controls -
// are asserted once, for both controls, in the shared suite.
describeOptionSelectableConformance(buttonGroupSpec, selectSpec);

describe("control/buttonGroup", () => {
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

  /** Renders a control into the container and hands back the container element. */
  const render = (control: unknown) => {
    d3Select(container).call(control as never);
    return container;
  };

  const wrapper = () => container.querySelector<HTMLDivElement>(".sszvis-control-buttonGroup");
  const buttons = () => [
    ...container.querySelectorAll<HTMLButtonElement>(".sszvis-control-buttonGroup__item"),
  ];
  const checked = () => buttons().map((b) => b.getAttribute("aria-checked"));
  const tabindexes = () => buttons().map((b) => b.getAttribute("tabindex"));

  /** Dispatches a real, bubbling, cancelable keydown - as a browser would. */
  const keydown = (el: Element, key: string) => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };

  test("should size the group at 300px when no width is configured", () => {
    render(buttonGroup().values(["A", "B"]).current("A"));
    expect(wrapper()?.style.width).toBe("300px");
  });

  test("should size the group at the configured width when one is given", () => {
    render(buttonGroup().values(["A", "B"]).current("A").width(240));
    expect(wrapper()?.style.width).toBe("240px");
  });

  test("should render one button per value, in order, labelled with the value, when values are configured", () => {
    render(buttonGroup().values(["A", "B", "C"]).current("A"));
    expect(buttons().map((b) => b.textContent)).toEqual(["A", "B", "C"]);
  });

  // The width is divided evenly and written out unrounded, whatever the number of values: the
  // browser keeps a fractional width at its own precision rather than the group losing pixels to
  // rounding.
  test.each([
    { width: 300, values: ["A", "B", "C"], expected: "100px" },
    { width: 200, values: ["A", "B", "C", "D"], expected: "50px" },
    { width: 100, values: ["A", "B", "C"], expected: "33.3333px" },
  ])(
    "should give each of $values.length buttons $expected when the group is $width px wide",
    ({ width, values, expected }) => {
      render(buttonGroup().values(values).current("A").width(width));
      expect(buttons().map((b) => b.style.width)).toEqual(values.map(() => expected));
    },
  );

  test("should mark only the current value as selected when it is one of the values", () => {
    render(buttonGroup().values(["A", "B", "C"]).current("B"));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true, false]);
    // the class is the visual hook; `aria-checked` is what assistive technology reads
    expect(checked()).toEqual(["false", "true", "false"]);
  });

  test("should mark nothing as selected or checked when current matches no value", () => {
    render(buttonGroup().values(["A", "B"]).current("Z"));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, false]);
    expect(checked()).toEqual(["false", "false"]);
  });

  test("should select nothing when current only loosely equals a value", () => {
    // A numeric `current` against string values: `===` selects nothing, whereas `==` would
    // match "2". Comparing "2" with "2" would pass either way and so pins nothing.
    render(buttonGroup().values(["1", "2"]).current(2));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, false]);
    // the same value as a string does select, so the values themselves are reachable
    render(buttonGroup().values(["1", "2"]).current("2"));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true]);
  });

  test("should move the selection, the checked state and the tab stop when current changes", () => {
    const sel = d3Select(container);
    sel.call(buttonGroup().values(["A", "B"]).current("A") as never);
    sel.call(buttonGroup().values(["A", "B"]).current("B") as never);
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true]);
    // the accessible state and the tab stop move with it
    expect(checked()).toEqual(["false", "true"]);
    expect(tabindexes()).toEqual(["-1", "0"]);
  });

  test("should re-divide the width over the remaining buttons when fewer values are rendered", () => {
    const sel = d3Select(container);
    sel.call(buttonGroup().values(["A", "B", "C"]).current("A").width(300) as never);
    sel.call(buttonGroup().values(["A", "B"]).current("A").width(300) as never);
    expect(buttons().map((b) => b.textContent)).toEqual(["A", "B"]);
    expect(buttons().map((b) => b.style.width)).toEqual(["150px", "150px"]);
  });

  describe("accessibility", () => {
    test("should expose the options as focusable radios inside a radiogroup when rendered", () => {
      render(buttonGroup().values(["A", "B"]).current("A"));
      expect(wrapper()?.getAttribute("role")).toBe("radiogroup");
      const button = buttons()[0];
      expect(button?.tagName).toBe("BUTTON");
      // `type="button"` keeps the control from submitting a surrounding form
      expect(button?.getAttribute("type")).toBe("button");
      expect(button?.getAttribute("role")).toBe("radio");
      expect(button?.getAttribute("aria-checked")).toBe("true");
      button?.focus();
      expect(document.activeElement).toBe(button);
    });

    test("should keep only the current option in the tab order when current is one of the values", () => {
      render(buttonGroup().values(["A", "B", "C"]).current("B"));
      expect(tabindexes()).toEqual(["-1", "0", "-1"]);
    });

    test("should put the first option in the tab order when current matches no value", () => {
      // Otherwise no option would be tabbable and the group would be unreachable, even
      // though nothing is marked selected.
      render(buttonGroup().values(["A", "B"]).current("Z"));
      expect(tabindexes()).toEqual(["0", "-1"]);
      expect(checked()).toEqual(["false", "false"]);
    });

    test.each([
      { key: "Enter", index: 2, value: "C" },
      { key: " ", index: 1, value: "B" },
    ])(
      "should report the focused option exactly once when $key is pressed on it",
      ({ key, index, value }) => {
        const change = vi.fn();
        render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
        const button = buttons()[index];
        button?.focus();
        const event = keydown(button as Element, key);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe(event);
        expect(change.mock.calls[0][1]).toBe(value);
        // The native button activation is suppressed, so a keypress reports the option once
        // rather than twice.
        expect(event.defaultPrevented).toBe(true);
      },
    );

    // Both axes move the selection, and both ends wrap, which is what makes the group behave
    // like a native radio group however it is laid out.
    test.each([
      { key: "ArrowRight", from: 0, to: 1, value: "B" },
      { key: "ArrowDown", from: 0, to: 1, value: "B" },
      { key: "ArrowLeft", from: 2, to: 1, value: "B" },
      { key: "ArrowUp", from: 2, to: 1, value: "B" },
      { key: "ArrowLeft", from: 0, to: 2, value: "C" },
      { key: "ArrowRight", from: 2, to: 0, value: "A" },
    ])(
      "should move the focus to option $to and report $value when $key is pressed on option $from",
      ({ key, from, to, value }) => {
        const change = vi.fn();
        render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
        buttons()[from]?.focus();
        keydown(buttons()[from] as Element, key);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][1]).toBe(value);
        expect(document.activeElement).toBe(buttons()[to]);
      },
    );

    test("should report nothing and let the browser act when a key it does not handle is pressed", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B"]).current("A").change(change));
      const event = keydown(buttons()[0] as Element, "a");
      expect(change).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    test("should stay a valid but unreachable radiogroup when the value list is empty", () => {
      render(buttonGroup().values([]).current("A"));
      expect(wrapper()?.getAttribute("role")).toBe("radiogroup");
      expect(buttons()).toEqual([]);
      expect(container.querySelectorAll("[tabindex='0']").length).toBe(0);
    });
  });

  describe("known quirks", () => {
    test("an empty value list leaves an empty, full-width wrapper", () => {
      // NOTE: with no values the button width is 300 / 0 = Infinity, but no buttons are
      // rendered so the invalid length is never written to the DOM. The wrapper is still
      // created at its configured width, so the layout keeps a 300px gap.
      render(buttonGroup().values([]).current("A"));
      expect(buttons()).toEqual([]);
      expect(wrapper()?.style.width).toBe("300px");
    });

    test("labels are never trimmed to fit their button", () => {
      // NOTE: unlike the select control, buttonGroup does no measuring, so a label wider
      // than width / values.length keeps its full text and wraps onto more lines inside its
      // button - the label is never cut. This suite runs in a real browser, so the wrapping
      // itself is observable here: the button stays within its share of the width and grows
      // taller instead.
      const long = "An extremely long button label that cannot possibly fit";
      render(buttonGroup().values([long]).current(long).width(100));
      const button = buttons()[0] as HTMLButtonElement;
      expect(button.textContent).toBe(long);

      const oneLine = (() => {
        container.textContent = "";
        render(buttonGroup().values(["A"]).current("A").width(100));
        return (buttons()[0] as HTMLButtonElement).getBoundingClientRect().height;
      })();

      container.textContent = "";
      render(buttonGroup().values([long]).current(long).width(100));
      const box = (buttons()[0] as HTMLButtonElement).getBoundingClientRect();
      // Wrapped, not cut off and not stretched sideways: taller than a single line, and no
      // wider than its share of the group plus whatever an unbreakable word forces.
      expect(box.height).toBeGreaterThan(oneLine);
      expect(box.width).toBeLessThan(200);
    });

    test("every button equal to current is marked selected", () => {
      // NOTE: selectedness is computed per button with no notion of uniqueness, so a
      // duplicated value highlights twice.
      render(buttonGroup().values(["A", "B", "A"]).current("A"));
      expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([true, false, true]);
    });

    test("marks exactly one duplicate as checked, however many carry the class", () => {
      // The `selected` class is per button and highlights every occurrence, but a
      // radiogroup exposing two checked radios is contradictory state, so aria-checked is
      // keyed on the index of `current` instead.
      render(buttonGroup().values(["A", "B", "A"]).current("A"));
      expect(buttons().map((b) => b.getAttribute("aria-checked"))).toEqual([
        "true",
        "false",
        "false",
      ]);
    });

    test("accepts non-string values, where the select control would crash", () => {
      // NOTE: buttonGroup does no measuring, so labels are produced purely by d3's
      // `.text()` coercion and any value type works. The sibling select control slices
      // the raw value while trimming labels, so it throws on a long non-string value.
      // The two controls are advertised as interchangeable but do not accept the same
      // value types.
      render(buttonGroup<number>().values([1, 2, 3]).current(2));
      expect(buttons().map((b) => b.textContent)).toEqual(["1", "2", "3"]);
      expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true, false]);
    });

    test("the default change handler swallows the click", () => {
      // NOTE: `change` defaults to `fn.identity`, an arity-1 function. It receives the
      // click event, returns it, and never sees the clicked value, so clicking an
      // unconfigured control does nothing and warns about nothing.
      const group = buttonGroup().values(["A", "B"]).current("A");
      const event = new MouseEvent("click");
      expect(group.change()(event, "B")).toBe(event);
    });
  });
});
