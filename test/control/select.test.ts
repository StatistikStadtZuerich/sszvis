import { select as d3Select } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import buttonGroup from "../../src/control/buttonGroup.js";
import selectMenu from "../../src/control/select.js";
import "../../src/d3-selectdiv.js";

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

  test("should render a wrapper carrying both the shared and the specific class", () => {
    render(selectMenu().values(["A", "B"]).current("A"));
    const el = wrapper();
    expect(el).toBeTruthy();
    expect(el?.classList.contains("sszvis-control-optionSelectable")).toBe(true);
  });

  test("should default the width to 300px and size the select 30px wider", () => {
    render(selectMenu().values(["A", "B"]).current("A"));
    expect(wrapper()?.style.width).toBe("300px");
    expect(selectEl()?.style.width).toBe("330px");
  });

  test("should apply a configured width to both the wrapper and the select", () => {
    render(selectMenu().values(["A", "B"]).current("A").width(200));
    expect(wrapper()?.style.width).toBe("200px");
    expect(selectEl()?.style.width).toBe("230px");
  });

  test("should render one option per value, in order", () => {
    render(selectMenu().values(["A", "B", "C"]).current("A"));
    expect(options().map((o) => o.textContent)).toEqual(["A", "B", "C"]);
  });

  test("should store the index rather than the value in each option", () => {
    render(selectMenu().values(["A", "B", "C"]).current("A"));
    expect(options().map((o) => o.getAttribute("value"))).toEqual(["0", "1", "2"]);
  });

  test("should mark the current value as selected", () => {
    render(selectMenu().values(["A", "B", "C"]).current("B"));
    expect(options().map((o) => o.getAttribute("selected"))).toEqual([null, "selected", null]);
    expect(selectEl()?.value).toBe("1");
  });

  test("should compare the current value by identity", () => {
    const a = { toString: () => "A" };
    const b = { toString: () => "B" };
    render(selectMenu().values([a, b]).current(b));
    expect(options().map((o) => o.getAttribute("selected"))).toEqual([null, "selected"]);
  });

  test("should select nothing when current matches no value", () => {
    render(selectMenu().values(["A", "B"]).current("Z"));
    expect(options().map((o) => o.getAttribute("selected"))).toEqual([null, null]);
    // With no option marked selected the browser falls back to the first one.
    expect(selectEl()?.value).toBe("0");
  });

  test("should render a metrics element used for measuring label widths", () => {
    render(selectMenu().values(["A"]).current("A"));
    const metrics = container.querySelector<HTMLDivElement>(".sszvis-control-select__metrics");
    expect(metrics).toBeTruthy();
    expect(metrics?.style.position).toBe("absolute");
  });

  describe("change callback", () => {
    test("should be called with the event and the newly selected value", () => {
      const change = vi.fn();
      render(selectMenu().values(["A", "B", "C"]).current("A").change(change));
      const el = selectEl() as HTMLSelectElement;
      el.value = "2";
      el.dispatchEvent(new Event("change"));
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0]).toBeInstanceOf(Event);
      expect(change.mock.calls[0][1]).toBe("C");
    });

    test("should not change the component's own state", () => {
      const menu = selectMenu().values(["A", "B"]).current("A").change(vi.fn());
      render(menu);
      const el = selectEl() as HTMLSelectElement;
      el.value = "1";
      el.dispatchEvent(new Event("change"));
      expect(menu.current()).toBe("A");
    });

    test("should blur the select after a change so it stops being highlighted", async () => {
      const focus = vi.spyOn(window, "focus");
      render(selectMenu().values(["A", "B"]).current("A").change(vi.fn()));
      const el = selectEl() as HTMLSelectElement;
      el.value = "1";
      el.dispatchEvent(new Event("change"));
      expect(focus).not.toHaveBeenCalled();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(focus).toHaveBeenCalled();
    });

    test("should default to a no-op-ish handler that does not throw", () => {
      render(selectMenu().values(["A", "B"]).current("A"));
      const el = selectEl() as HTMLSelectElement;
      el.value = "1";
      expect(() => el.dispatchEvent(new Event("change"))).not.toThrow();
    });
  });

  describe("label truncation", () => {
    test("should leave labels that fit untouched", () => {
      render(selectMenu().values(["A", "B"]).current("A").width(300));
      expect(options().map((o) => o.textContent)).toEqual(["A", "B"]);
    });

    test("should trim an overlong label and mark it with an ellipsis", () => {
      const long = "A very long option label that will certainly not fit";
      render(selectMenu().values([long]).current(long).width(120));
      const text = options()[0]?.textContent ?? "";
      expect(text.length).toBeLessThan(long.length);
      expect(text.endsWith("…")).toBe(true);
      expect(long.startsWith(text.slice(0, -1))).toBe(true);
    });

    test("should truncate against width minus 40px, not the full width", () => {
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
  });

  test("should re-render in place rather than appending duplicates", () => {
    const menu = selectMenu().values(["A", "B"]).current("A");
    const sel = d3Select(container);
    sel.call(menu as never);
    sel.call(menu as never);
    expect(container.querySelectorAll(".sszvis-control-select").length).toBe(1);
    expect(container.querySelectorAll(".sszvis-control-select__element").length).toBe(1);
    expect(options().length).toBe(2);
  });

  test("should shrink the option list when fewer values are rendered", () => {
    const sel = d3Select(container);
    sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
    sel.call(selectMenu().values(["A"]).current("A") as never);
    expect(options().map((o) => o.textContent)).toEqual(["A"]);
  });

  test("should replace a buttonGroup rendered into the same container", () => {
    // Both controls key their wrapper off `.sszvis-control-optionSelectable` with the
    // control name as the join key, so swapping between the two is a data change and
    // the previous control's DOM is removed. This is what makes them interchangeable.
    const sel = d3Select(container);
    sel.call(buttonGroup().values(["A", "B"]).current("A") as never);
    expect(container.querySelectorAll(".sszvis-control-buttonGroup").length).toBe(1);
    sel.call(selectMenu().values(["A", "B"]).current("A") as never);
    expect(container.querySelectorAll(".sszvis-control-buttonGroup").length).toBe(0);
    expect(container.querySelectorAll(".sszvis-control-select").length).toBe(1);
  });

  describe("interaction after re-render", () => {
    test("should call the handler configured by the most recent render", () => {
      const first = vi.fn();
      const second = vi.fn();
      const sel = d3Select(container);
      sel.call(selectMenu().values(["A", "B"]).current("A").change(first) as never);
      sel.call(selectMenu().values(["A", "B"]).current("A").change(second) as never);
      const el = selectEl() as HTMLSelectElement;
      el.value = "1";
      el.dispatchEvent(new Event("change"));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(expect.any(Event), "B");
    });
  });

  describe("known quirks", () => {
    test("re-rendering does not move the selection once the user has changed it", () => {
      // BUG: the current value is written with `.attr("selected", …)`, which sets the
      // content attribute. Once the user interacts with the select, the option's
      // dirtiness flag is set and the browser stops deriving selectedness from the
      // attribute, so a re-render with a different `current` cannot pull the selection
      // back - the attribute and the rendered selection diverge.
      // current: the select keeps showing the user's choice. expected: write the
      // selection with `.property("selected", …)` so `current` stays authoritative.
      const sel = d3Select(container);
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      const el = selectEl() as HTMLSelectElement;
      el.value = "2";
      el.dispatchEvent(new Event("change"));
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      expect(el.querySelectorAll("option")[0]?.getAttribute("selected")).toBe("selected");
      expect(el.value).toBe("2");
    });

    test("the default change handler returns the event and discards the value", () => {
      // NOTE: `change` defaults to `fn.identity`, an arity-1 function. It receives the
      // event, returns it, and never sees the selected value, so interacting with an
      // unconfigured select does nothing at all and warns about nothing. Harmless, but
      // it makes a forgotten `.change()` hard to notice.
      const menu = selectMenu().values(["A", "B"]).current("A");
      expect(menu.change()("event", "value")).toBe("event");
    });

    test("a missing values prop throws mid-render and leaves a partial control behind", () => {
      // NOTE: `values` has no default, so a control rendered before its data is
      // available throws from d3's data join. Every sszvis control shares this "required
      // props are not defaulted" contract, so the throw itself is intended - but the
      // wrapper is styled before the throw, so the failed render leaves an empty,
      // width-styled control in the DOM rather than nothing at all.
      expect(() => render(selectMenu().current("A"))).toThrow(TypeError);
      expect(wrapper()).toBeTruthy();
      expect(wrapper()?.style.width).toBe("300px");
      expect(selectEl()).toBeTruthy();
      expect(options()).toEqual([]);
    });

    test("truncation drops two characters in its first step, not one", () => {
      // NOTE: `fitText` recurses with `str.slice(0, -2) + "…"`, so the first step removes
      // two real characters where one would have done - the ellipsis replaces the second
      // rather than being appended. Later steps remove one each. A label that overflows
      // by a single character is therefore trimmed by two.
      const maxWidth = 120 - 40;
      render(selectMenu().values(["M"]).current("M").width(120));
      const metrics = container.querySelector<HTMLDivElement>(
        ".sszvis-control-select__metrics"
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

    test("a measuring width below zero spins for the full recursion limit", () => {
      // BUG: with a width small enough that `width - 40` is negative, the recursion
      // reaches "…", where `"…".slice(0, -2) + "…"` is again "…" - a fixed point. It then
      // runs the full MAX_RECURSION of 1000 steps, each one a forced synchronous layout
      // read, before returning "…" anyway.
      // current: 1000 layout reads per option. expected: bail out as soon as the
      // candidate string stops shrinking.
      const clientWidth = vi.spyOn(Element.prototype, "clientWidth", "get");
      render(selectMenu().values(["Hello"]).current("Hello").width(20));
      expect(options()[0]?.textContent).toBe("…");
      expect(clientWidth.mock.calls.length).toBeGreaterThanOrEqual(1000);
    });

    test("a non-string value crashes as soon as its label needs trimming", () => {
      // BUG: `truncateToWidth` calls `str.slice(…)` on the raw datum, so any value that
      // is not a string fails the moment it is too wide to fit. Short numbers survive
      // because the recursion never runs, which makes this crash depend on the width.
      // current: TypeError for a long numeric value. expected: `String(d)` before
      // measuring, matching the `.text()` coercion every other control relies on.
      expect(() => render(selectMenu().values([123_456_789_012_345]).current(1).width(60))).toThrow(
        TypeError
      );
    });

    test("every value equal to current is marked selected", () => {
      // NOTE: selectedness is computed per option with no notion of uniqueness, so a
      // duplicated value produces two `selected` attributes. Browsers resolve this by
      // honouring the last one, but the markup is invalid.
      render(selectMenu().values(["A", "B", "A"]).current("A"));
      expect(options().map((o) => o.getAttribute("selected"))).toEqual([
        "selected",
        null,
        "selected",
      ]);
    });

    test("a stale selection index reports undefined instead of being ignored", () => {
      // BUG: the change handler looks the value up as `props.values[i]` using the index
      // stored in the option. If the value list shrank since the browser recorded that
      // index, the lookup misses and the callback is invoked with `undefined` rather
      // than being skipped.
      // current: change(event, undefined). expected: ignore a selection that no longer
      // maps to a value.
      const change = vi.fn();
      render(selectMenu().values(["A", "B", "C"]).current("A").change(change));
      const el = selectEl() as HTMLSelectElement;
      el.value = "9";
      // The browser rejects an unknown value, so drive the handler the way a shrunk
      // list would: an option whose index no longer exists in `values`.
      el.querySelectorAll("option")[2]?.setAttribute("value", "9");
      el.value = "9";
      el.dispatchEvent(new Event("change"));
      expect(change).toHaveBeenCalledWith(expect.any(Event), undefined);
    });
  });
});
