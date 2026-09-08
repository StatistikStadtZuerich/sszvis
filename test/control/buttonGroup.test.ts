import { select as d3Select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import buttonGroup from "../../src/control/buttonGroup.js";
import selectMenu from "../../src/control/select.js";
import "../../src/d3-selectdiv.js";

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

  test("should render an unset values the same as an empty one", () => {
    render(buttonGroup().width(200));
    const unset = container.innerHTML;
    container.innerHTML = "";
    render(buttonGroup().width(200).values([]));
    expect(container.innerHTML).toBe(unset);
  });

  test("should render an empty control when values is set to undefined", () => {
    // The shape #357 was filed against: a chart hands the control a state key that is only
    // assigned when its CSV resolves, so the setter is called with undefined rather than skipped.
    render(
      buttonGroup()
        .width(200)
        .values(undefined as never)
    );
    expect(wrapper()).toBeTruthy();
    expect(buttons()).toHaveLength(0);
  });

  test("should render an undefined values the same as an empty one", () => {
    render(
      buttonGroup()
        .width(200)
        .values(undefined as never)
    );
    const undef = container.innerHTML;
    container.innerHTML = "";
    render(buttonGroup().width(200).values([]));
    expect(container.innerHTML).toBe(undef);
  });

  test("should render a wrapper carrying both the shared and the specific class", () => {
    render(buttonGroup().values(["A", "B"]).current("A"));
    const el = wrapper();
    expect(el).toBeTruthy();
    expect(el?.classList.contains("sszvis-control-optionSelectable")).toBe(true);
  });

  test("should default the width to 300px", () => {
    render(buttonGroup().values(["A", "B"]).current("A"));
    expect(wrapper()?.style.width).toBe("300px");
  });

  test("should apply a configured width to the wrapper", () => {
    render(buttonGroup().values(["A", "B"]).current("A").width(240));
    expect(wrapper()?.style.width).toBe("240px");
  });

  test("should render one button per value, in order, labelled with the value", () => {
    render(buttonGroup().values(["A", "B", "C"]).current("A"));
    expect(buttons().map((b) => b.textContent)).toEqual(["A", "B", "C"]);
  });

  test("should divide the width evenly between the buttons", () => {
    render(buttonGroup().values(["A", "B", "C"]).current("A").width(300));
    expect(buttons().map((b) => b.style.width)).toEqual(["100px", "100px", "100px"]);
  });

  test("should divide by the number of values, whatever that number is", () => {
    render(buttonGroup().values(["A", "B", "C", "D"]).current("A").width(200));
    expect(buttons().map((b) => b.style.width)).toEqual(["50px", "50px", "50px", "50px"]);
  });

  test("should not round the button width", () => {
    render(buttonGroup().values(["A", "B", "C"]).current("A").width(100));
    // 100 / 3 is written out as a fractional width rather than rounded to whole pixels;
    // the browser keeps it at its own precision.
    expect(buttons()[0]?.style.width).toBe("33.3333px");
  });

  test("should mark only the current value as selected", () => {
    render(buttonGroup().values(["A", "B", "C"]).current("B"));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true, false]);
    // the class is the visual hook; `aria-checked` is what assistive technology reads
    expect(checked()).toEqual(["false", "true", "false"]);
  });

  test("should mark nothing as selected when current matches no value", () => {
    render(buttonGroup().values(["A", "B"]).current("Z"));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, false]);
  });

  test("should compare the current value strictly", () => {
    // A numeric `current` against string values: `===` selects nothing, whereas `==` would
    // match "2". Comparing "2" with "2" would pass either way and so pins nothing.
    render(buttonGroup().values(["1", "2"]).current(2));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, false]);
    // the same value as a string does select, so the values themselves are reachable
    render(buttonGroup().values(["1", "2"]).current("2"));
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true]);
  });

  test("should move the selected class on re-render", () => {
    const sel = d3Select(container);
    sel.call(buttonGroup().values(["A", "B"]).current("A") as never);
    sel.call(buttonGroup().values(["A", "B"]).current("B") as never);
    expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([false, true]);
    // the accessible state and the tab stop move with it
    expect(checked()).toEqual(["false", "true"]);
    expect(tabindexes()).toEqual(["-1", "0"]);
  });

  describe("change callback", () => {
    test("should be called with the event and the clicked value", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
      buttons()[2]?.dispatchEvent(new MouseEvent("click"));
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
      expect(change.mock.calls[0][1]).toBe("C");
    });

    test("should not change the component's own state", () => {
      const group = buttonGroup().values(["A", "B"]).current("A").change(vi.fn());
      render(group);
      buttons()[1]?.dispatchEvent(new MouseEvent("click"));
      expect(group.current()).toBe("A");
      expect(buttons().map((b) => b.classList.contains("selected"))).toEqual([true, false]);
    });

    test("should call the handler configured by the most recent render", () => {
      const first = vi.fn();
      const second = vi.fn();
      const sel = d3Select(container);
      sel.call(buttonGroup().values(["A", "B"]).current("A").change(first) as never);
      sel.call(buttonGroup().values(["A", "B"]).current("A").change(second) as never);
      buttons()[1]?.dispatchEvent(new MouseEvent("click"));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(expect.any(MouseEvent), "B");
    });

    test("should default to a handler that does not throw", () => {
      render(buttonGroup().values(["A", "B"]).current("A"));
      expect(() => buttons()[1]?.dispatchEvent(new MouseEvent("click"))).not.toThrow();
    });
  });

  test("should re-render in place rather than appending duplicates", () => {
    const group = buttonGroup().values(["A", "B"]).current("A");
    const sel = d3Select(container);
    sel.call(group as never);
    sel.call(group as never);
    expect(container.querySelectorAll(".sszvis-control-buttonGroup").length).toBe(1);
    expect(buttons().length).toBe(2);
  });

  test("should shrink the button list and re-divide the width when fewer values are rendered", () => {
    const sel = d3Select(container);
    sel.call(buttonGroup().values(["A", "B", "C"]).current("A").width(300) as never);
    sel.call(buttonGroup().values(["A", "B"]).current("A").width(300) as never);
    expect(buttons().map((b) => b.textContent)).toEqual(["A", "B"]);
    expect(buttons().map((b) => b.style.width)).toEqual(["150px", "150px"]);
  });

  test("should replace a select control rendered into the same container", () => {
    // Both controls key their wrapper off `.sszvis-control-optionSelectable` with the
    // control name as the join key, so swapping between the two is a data change and the
    // previous control's DOM is removed. This is what makes them interchangeable.
    const sel = d3Select(container);
    sel.call(selectMenu().values(["A", "B"]).current("A") as never);
    expect(container.querySelectorAll(".sszvis-control-select").length).toBe(1);
    sel.call(buttonGroup().values(["A", "B"]).current("A") as never);
    expect(container.querySelectorAll(".sszvis-control-select").length).toBe(0);
    expect(container.querySelectorAll(".sszvis-control-buttonGroup").length).toBe(1);
  });

  describe("accessibility", () => {
    test("should render the options as focusable radios inside a radiogroup", () => {
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

    test("should carry no aria-label when ariaLabel is unset", () => {
      render(buttonGroup().values(["A", "B"]).current("A"));
      expect(wrapper()?.hasAttribute("aria-label")).toBe(false);
    });

    test("should name the radiogroup with the given ariaLabel", () => {
      render(buttonGroup().values(["A", "B"]).current("A").ariaLabel("Year"));
      expect(wrapper()?.getAttribute("aria-label")).toBe("Year");
    });

    test("should keep an explicitly empty ariaLabel rather than dropping it", () => {
      // `??`, not `||`: an empty string is a value the caller supplied, not an absence.
      render(buttonGroup().values(["A", "B"]).current("A").ariaLabel(""));
      expect(wrapper()?.getAttribute("aria-label")).toBe("");
    });

    test("should remove the name again when a later render omits ariaLabel", () => {
      const sel = d3Select(container);
      sel.call(buttonGroup().values(["A", "B"]).current("A").ariaLabel("Year") as never);
      sel.call(buttonGroup().values(["A", "B"]).current("A") as never);
      expect(wrapper()?.hasAttribute("aria-label")).toBe(false);
    });

    test("should keep exactly one option in the tab order, and it is the current one", () => {
      render(buttonGroup().values(["A", "B", "C"]).current("B"));
      expect(tabindexes()).toEqual(["-1", "0", "-1"]);
    });

    test("should fall back to the first option as the tab stop when current matches nothing", () => {
      // Otherwise no option would be tabbable and the group would be unreachable, even
      // though nothing is marked selected.
      render(buttonGroup().values(["A", "B"]).current("Z"));
      expect(tabindexes()).toEqual(["0", "-1"]);
      expect(checked()).toEqual(["false", "false"]);
    });

    test("should call change on Enter, the same way a click does", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
      const button = buttons()[2];
      button?.focus();
      const event = keydown(button as Element, "Enter");
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0]).toBe(event);
      expect(change.mock.calls[0][1]).toBe("C");
      // the native button activation is suppressed so a keypress fires change exactly once
      expect(event.defaultPrevented).toBe(true);
    });

    test("should call change on Space, the same way a click does", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
      const button = buttons()[1];
      button?.focus();
      const event = keydown(button as Element, " ");
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][1]).toBe("B");
      expect(event.defaultPrevented).toBe(true);
    });

    test("should move the selection forwards with ArrowRight and ArrowDown", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
      buttons()[0]?.focus();
      keydown(buttons()[0] as Element, "ArrowRight");
      expect(change.mock.calls[0][1]).toBe("B");
      expect(document.activeElement).toBe(buttons()[1]);

      keydown(buttons()[1] as Element, "ArrowDown");
      expect(change.mock.calls[1][1]).toBe("C");
      expect(document.activeElement).toBe(buttons()[2]);
    });

    test("should move the selection backwards with ArrowLeft and ArrowUp", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B", "C"]).current("C").change(change));
      buttons()[2]?.focus();
      keydown(buttons()[2] as Element, "ArrowLeft");
      expect(change.mock.calls[0][1]).toBe("B");
      expect(document.activeElement).toBe(buttons()[1]);

      keydown(buttons()[1] as Element, "ArrowUp");
      expect(change.mock.calls[1][1]).toBe("A");
      expect(document.activeElement).toBe(buttons()[0]);
    });

    test("should wrap the selection at both ends", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B", "C"]).current("A").change(change));
      keydown(buttons()[0] as Element, "ArrowLeft");
      expect(change.mock.calls[0][1]).toBe("C");
      expect(document.activeElement).toBe(buttons()[2]);

      keydown(buttons()[2] as Element, "ArrowRight");
      expect(change.mock.calls[1][1]).toBe("A");
      expect(document.activeElement).toBe(buttons()[0]);
    });

    test("should ignore keys it does not handle", () => {
      const change = vi.fn();
      render(buttonGroup().values(["A", "B"]).current("A").change(change));
      const event = keydown(buttons()[0] as Element, "a");
      expect(change).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    test("should leave a valid but non-focusable group for an empty value list", () => {
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
      // than width / values.length simply overflows its button. Callers have to keep
      // labels short themselves.
      const long = "An extremely long button label that cannot possibly fit";
      render(buttonGroup().values([long]).current(long).width(100));
      expect(buttons()[0]?.textContent).toBe(long);
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

    test("marks nothing as checked when current matches no value", () => {
      render(buttonGroup().values(["A", "B"]).current("C"));
      expect(buttons().map((b) => b.getAttribute("aria-checked"))).toEqual(["false", "false"]);
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
