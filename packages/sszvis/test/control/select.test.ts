import { select as d3Select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import selectMenu from "../../src/control/select.js";
import {
  buttonGroupSpec,
  describeOptionSelectableConformance,
  selectSpec,
} from "../support/optionSelectableConformance.js";
import "../../src/d3-selectdiv.js";

// The promises this control shares with `control/buttonGroup` - values coercion, the wrapper
// class, the change callback, the accessible name, re-rendering and the swap between the two
// controls - are asserted once, for both controls, in the shared suite.
describeOptionSelectableConformance(selectSpec, buttonGroupSpec);

describe("control/select", () => {
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

  /** Renders a control into a fresh container and hands back the container element. */
  const render = (control: unknown) => {
    d3Select(container).call(control as never);
    return container;
  };

  const wrapper = () => container.querySelector<HTMLDivElement>(".sszvis-control-select");
  const selectEl = () =>
    container.querySelector<HTMLSelectElement>(".sszvis-control-select__element");
  const options = () => [...(selectEl()?.options ?? [])];

  test("should size the wrapper at the configured width, or 300px, and the select 30px wider", () => {
    render(selectMenu().values(["A", "B"]).current("A"));
    expect(wrapper()?.style.width).toBe("300px");
    expect(selectEl()?.style.width).toBe("330px");
    container.textContent = "";
    render(selectMenu().values(["A", "B"]).current("A").width(200));
    expect(wrapper()?.style.width).toBe("200px");
    expect(selectEl()?.style.width).toBe("230px");
  });

  test("should render one option per value, in order, when values are configured", () => {
    render(selectMenu().values(["A", "B", "C"]).current("A"));
    expect(options().map((o) => o.textContent)).toEqual(["A", "B", "C"]);
  });

  test("should store the value itself in each option, so a selection resolves by value", () => {
    render(selectMenu().values(["A", "B", "C"]).current("A"));
    expect(options().map((o) => o.getAttribute("value"))).toEqual(["A", "B", "C"]);
  });

  test("should mark the current value as selected when it is one of the values", () => {
    render(selectMenu().values(["A", "B", "C"]).current("B"));
    expect(options().map((o) => o.selected)).toEqual([false, true, false]);
    expect(selectEl()?.value).toBe("B");
  });

  test("should select only the exact value when another value merely looks like it", () => {
    // The values are compared with `===`, so a value that merely stringifies like the
    // current one is not treated as selected. The ported types constrain values to
    // strings, so this is only observable for strings that differ in case or whitespace.
    render(selectMenu().values(["A", "a"]).current("a"));
    expect(options().map((o) => o.selected)).toEqual([false, true]);
  });

  test("should leave the browser showing the first option when current matches no value", () => {
    render(selectMenu().values(["A", "B"]).current("Z"));
    expect(options().map((o) => o.selected)).toEqual([true, false]);
    // With no option marked selected the browser falls back to the first one.
    expect(selectEl()?.value).toBe("A");
  });

  test("should render a duplicated value twice and select the last of them, without warning", () => {
    // Selectedness is written per option with no notion of uniqueness, but a
    // single-select element holds exactly one selection, so the last write wins. Options
    // are keyed by value, yet a repeated value still gets one option per occurrence.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(selectMenu().values(["A", "B", "A"]).current("A"));
    expect(options().map((o) => o.textContent)).toEqual(["A", "B", "A"]);
    expect(options().map((o) => o.selected)).toEqual([false, false, true]);
    expect(selectEl()?.value).toBe("A");
    // A value repeated verbatim resolves to itself either way, so nothing is ambiguous.
    expect(warn).not.toHaveBeenCalled();
  });

  test("should warn and resolve to the first value when two values coerce to the same string", () => {
    // NOTE: the option key is `String(d)`, so distinct values sharing a coercion are
    // indistinguishable and the first of them wins. Only reachable from JS consumers and
    // the built bundle, since the types require strings.
    const change = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      selectMenu()
        // @ts-expect-error - see above; pins the collision for the built bundle.
        .values(["1", 1])
        .current("1")
        .change(change),
    );
    expect(options().map((o) => o.textContent)).toEqual(["1", "1"]);
    expect(warn).toHaveBeenCalled();
    const el = selectEl() as HTMLSelectElement;
    el.selectedIndex = 1;
    el.dispatchEvent(new Event("change"));
    expect(change).toHaveBeenCalledWith(expect.any(Event), "1");
  });

  test("should render a metrics element used for measuring label widths", () => {
    render(selectMenu().values(["A"]).current("A"));
    const metrics = container.querySelector<HTMLDivElement>(".sszvis-control-select__metrics");
    expect(metrics).toBeTruthy();
    expect(metrics?.style.position).toBe("absolute");
  });

  describe("change callback", () => {
    test("should blur the select after a change so it stops being highlighted", async () => {
      const focus = vi.spyOn(window, "focus");
      render(selectMenu().values(["A", "B"]).current("A").change(vi.fn()));
      const el = selectEl() as HTMLSelectElement;
      el.value = "B";
      el.dispatchEvent(new Event("change"));
      expect(focus).not.toHaveBeenCalled();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(focus).toHaveBeenCalled();
    });

    test("should warn and report nothing when the selection matches none of the configured values", () => {
      const change = vi.fn();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(selectMenu().values(["A", "B", "C"]).current("A").change(change));
      const el = selectEl() as HTMLSelectElement;
      // An option value the component did not write - the only way a selection can now
      // fail to resolve, since options carry their own value.
      el.querySelectorAll("option")[2]?.setAttribute("value", "Z");
      el.value = "Z";
      el.dispatchEvent(new Event("change"));
      expect(change).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
    });

    test("should report an empty selection only when the empty string is itself one of the values", () => {
      // Resolution is by value, so "" is a value like any other rather than standing for
      // "nothing selected" as it did when the value attribute held an index.
      const change = vi.fn();
      vi.spyOn(console, "warn").mockImplementation(() => {});
      render(selectMenu().values(["A", "B", "C"]).current("A").change(change));
      const notAValue = selectEl() as HTMLSelectElement;
      notAValue.querySelectorAll("option")[1]?.setAttribute("value", "");
      notAValue.value = "";
      notAValue.dispatchEvent(new Event("change"));
      expect(change).not.toHaveBeenCalled();

      container.textContent = "";
      render(selectMenu().values(["", "B"]).current("B").change(change));
      const isAValue = selectEl() as HTMLSelectElement;
      isAValue.value = "";
      isAValue.dispatchEvent(new Event("change"));
      expect(change).toHaveBeenCalledWith(expect.any(Event), "");
    });
  });

  describe("label truncation", () => {
    test("should leave a label untouched when it fits the control", () => {
      render(selectMenu().values(["A", "B"]).current("A").width(300));
      expect(options().map((o) => o.textContent)).toEqual(["A", "B"]);
    });

    test("should keep the start of the label and mark it with an ellipsis when it does not fit", () => {
      const long = "A very long option label that will certainly not fit";
      render(selectMenu().values([long]).current(long).width(120));
      const text = options()[0]?.textContent ?? "";
      expect(text.length).toBeLessThan(long.length);
      expect(text.endsWith("…")).toBe(true);
      expect(long.startsWith(text.slice(0, -1))).toBe(true);
    });

    test("should keep more of the label when the control is wider, reserving 40px for the chrome", () => {
      const long = "A very long option label that will certainly not fit";
      const narrow = (
        render(selectMenu().values([long]).current(long).width(120)).querySelector("option")
          ?.textContent ?? ""
      ).length;
      container.textContent = "";
      const wide = (
        render(selectMenu().values([long]).current(long).width(300)).querySelector("option")
          ?.textContent ?? ""
      ).length;
      expect(wide).toBeGreaterThan(narrow);
    });

    test("should truncate a one-character label that still overflows", () => {
      // "A" and the "…" it shortens to are both one character long, so a length-based
      // fixed-point test never took the first step and returned the overflowing original.
      render(selectMenu().values(["A"]).current("A").width(20));
      expect(options()[0]?.textContent).toBe("…");
    });

    test("should render every label as an ellipsis, in bounded time, when the control is too narrow for any of them", () => {
      // "…" is a fixed point of the shortening step, so a measuring budget below the 40px
      // allowance has to bail out rather than run MAX_RECURSION times per option.
      const values = ["one", "two", "three", "four", "five", "six", "seven", "eight"];
      const clientWidth = vi.spyOn(Element.prototype, "clientWidth", "get");
      render(selectMenu().values(values).current("one").width(20));
      expect(options().map((o) => o.textContent)).toEqual(values.map(() => "…"));
      // A handful of reads per option, nowhere near 1000 * values.length.
      expect(clientWidth.mock.calls.length).toBeLessThan(values.length * 20);
    });

    test("should show a non-string value as its own digits, whether or not the label has to be trimmed", () => {
      render(
        selectMenu()
          // @ts-expect-error - the ported types constrain values to strings; this pins the
          // runtime coercion that protects JS consumers and the built bundle, on the
          // truncating path and on the plain one.
          .values([123_456_789_012_345])
          .current("")
          .width(60),
      );
      const trimmed = options()[0]?.textContent ?? "";
      expect(trimmed.endsWith("…")).toBe(true);
      expect("123456789012345".startsWith(trimmed.slice(0, -1))).toBe(true);

      container.textContent = "";
      render(
        selectMenu()
          // @ts-expect-error - as above: coercion must happen on the non-truncating path too.
          .values([42])
          .current("")
          .width(300),
      );
      expect(options()[0]?.textContent).toBe("42");
      expect(options()[0]?.getAttribute("value")).toBe("42");
    });
  });

  describe("interaction after re-render", () => {
    test("should show whatever current says, in either direction, after the user has picked something else", () => {
      const sel = d3Select(container);
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      const el = selectEl() as HTMLSelectElement;
      el.value = "C";
      el.dispatchEvent(new Event("change"));

      // Back to where it started: the user's own pick is not remembered.
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      expect(el.value).toBe("A");
      expect(options().map((o) => o.selected)).toEqual([true, false, false]);

      sel.call(selectMenu().values(["A", "B", "C"]).current("B") as never);
      expect(el.value).toBe("B");
      sel.call(selectMenu().values(["A", "B", "C"]).current("C") as never);
      expect(el.value).toBe("C");
    });

    test("should report nothing rather than the wrong value when a stale selection arrives after a new list is rendered", () => {
      const change = vi.fn();
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const sel = d3Select(container);
      sel.call(selectMenu().values(["A", "B", "C"]).current("A").change(change) as never);
      const el = selectEl() as HTMLSelectElement;
      // the user picks the third option
      el.value = options()[2]?.value as string;
      el.dispatchEvent(new Event("change"));
      expect(change).toHaveBeenLastCalledWith(expect.any(Event), "C");
      change.mockClear();

      // the app re-renders with a different list of the same length
      sel.call(selectMenu().values(["X", "Y", "Z"]).current("X").change(change) as never);
      // a selection the browser recorded against the old list must not be read as the
      // value that happens to occupy that position now
      el.value = "2";
      el.dispatchEvent(new Event("change"));
      expect(change).not.toHaveBeenCalledWith(expect.any(Event), "Z");
    });
  });

  describe("known quirks", () => {
    test("the default change handler returns the event and discards the value", () => {
      // NOTE: `change` defaults to `fn.identity`, an arity-1 function. It receives the
      // event, returns it, and never sees the selected value, so interacting with an
      // unconfigured select does nothing at all and warns about nothing. Harmless, but
      // it makes a forgotten `.change()` hard to notice.
      const menu = selectMenu().values(["A", "B"]).current("A");
      const event = new Event("change");
      expect(menu.change()(event, "value")).toBe(event);
    });

    test("truncation drops two characters in its first step, not one", () => {
      // NOTE: `fitText` recurses with `str.slice(0, -2) + "…"`, so the first step removes
      // two real characters where one would have done - the ellipsis replaces the second
      // rather than being appended. Later steps remove one each. A label that overflows
      // by a single character is therefore trimmed by two.
      const maxWidth = 120 - 40;
      render(selectMenu().values(["M"]).current("M").width(120));
      const metrics = container.querySelector<HTMLDivElement>(
        ".sszvis-control-select__metrics",
      ) as HTMLDivElement;
      const fits = (text: string) => {
        metrics.textContent = text;
        return Math.ceil(metrics.clientWidth) <= maxWidth;
      };
      // The shortest run of "M" that no longer fits overflows by exactly one character.
      let length = 1;
      while (fits("M".repeat(length))) length++;

      container.textContent = "";
      const value = "M".repeat(length);
      render(selectMenu().values([value]).current(value).width(120));
      expect(options()[0]?.textContent).toBe(`${"M".repeat(length - 2)}…`);
    });
  });
});
