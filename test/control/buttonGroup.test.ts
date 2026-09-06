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
    ...container.querySelectorAll<HTMLDivElement>(".sszvis-control-buttonGroup__item"),
  ];

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

  describe("known quirks", () => {
    test("an empty value list leaves an empty, full-width wrapper", () => {
      // NOTE: with no values the button width is 300 / 0 = Infinity, but no buttons are
      // rendered so the invalid length is never written to the DOM. The wrapper is still
      // created at its configured width, so the layout keeps a 300px gap.
      render(buttonGroup().values([]).current("A"));
      expect(buttons()).toEqual([]);
      expect(wrapper()?.style.width).toBe("300px");
    });

    test("a missing values prop throws before anything is rendered", () => {
      // NOTE: `values` has no default, so a control rendered before its data is available
      // throws - here from reading `.length` off undefined, which happens before any DOM
      // is created. Unlike the select control, that leaves no partial control behind.
      expect(() => render(buttonGroup().current("A"))).toThrow(TypeError);
      expect(wrapper()).toBeNull();
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

    test("the buttons are plain divs with no accessible role or keyboard access", () => {
      // BUG: the items are `div`s with a click handler - not `button` elements and with no
      // role, tabindex, or aria-pressed state. The control is unreachable by keyboard and
      // announced as plain text by screen readers.
      // current: <div class="sszvis-control-buttonGroup__item">. expected: real buttons,
      // or divs with role="radio"/aria-checked inside a role="radiogroup" wrapper.
      render(buttonGroup().values(["A", "B"]).current("A"));
      const button = buttons()[0] as HTMLDivElement;
      expect(button.tagName).toBe("DIV");
      expect(button.getAttribute("role")).toBeNull();
      expect(button.getAttribute("tabindex")).toBeNull();
      expect(button.getAttribute("aria-pressed")).toBeNull();
      expect(wrapper()?.getAttribute("role")).toBeNull();
    });
  });
});
