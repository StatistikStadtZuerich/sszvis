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
    expect(options().map((o) => o.selected)).toEqual([false, true, false]);
    expect(selectEl()?.value).toBe("1");
  });

  test("should compare the current value strictly, not by rendered label", () => {
    // The values are compared with `===`, so a value that merely stringifies like the
    // current one is not treated as selected. The ported types constrain values to
    // strings, so this is only observable for strings that differ in case or whitespace.
    render(selectMenu().values(["A", "a"]).current("a"));
    expect(options().map((o) => o.selected)).toEqual([false, true]);
  });

  test("should select nothing when current matches no value", () => {
    render(selectMenu().values(["A", "B"]).current("Z"));
    expect(options().map((o) => o.selected)).toEqual([true, false]);
    // With no option marked selected the browser falls back to the first one.
    expect(selectEl()?.value).toBe("0");
  });

  test("a duplicated value selects the last match", () => {
    // Selectedness is written per option with no notion of uniqueness, but a
    // single-select element holds exactly one selection, so the last write wins.
    render(selectMenu().values(["A", "B", "A"]).current("A"));
    expect(options().map((o) => o.selected)).toEqual([false, false, true]);
    expect(selectEl()?.value).toBe("2");
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

    test("should move the selection back to current after the user has changed it", () => {
      const sel = d3Select(container);
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      const el = selectEl() as HTMLSelectElement;
      el.value = "2";
      el.dispatchEvent(new Event("change"));
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      expect(el.value).toBe("0");
      expect(options().map((o) => o.selected)).toEqual([true, false, false]);
    });

    test("should follow current in both directions after user interaction", () => {
      const sel = d3Select(container);
      sel.call(selectMenu().values(["A", "B", "C"]).current("A") as never);
      const el = selectEl() as HTMLSelectElement;
      el.value = "2";
      el.dispatchEvent(new Event("change"));
      sel.call(selectMenu().values(["A", "B", "C"]).current("B") as never);
      expect(el.value).toBe("1");
      sel.call(selectMenu().values(["A", "B", "C"]).current("C") as never);
      expect(el.value).toBe("2");
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
  });
});
