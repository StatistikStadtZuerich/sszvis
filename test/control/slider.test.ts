import { select as d3Select, scaleLinear, scaleLog, scaleTime } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import slider, { type SliderComponent } from "../../src/control/slider.js";
import "../../src/d3-selectgroup.js";

describe("control/slider", () => {
  let container: HTMLDivElement;
  let svg: SVGSVGElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    svg = d3Select(container)
      .append("svg")
      .attr("width", 400)
      .attr("height", 300)
      .node() as SVGSVGElement;
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  const scale = () => scaleLinear().domain([0, 10]).range([0, 300]);

  /** Renders a control into a fresh group and hands back that group's element. */
  const render = (control: SliderComponent) => {
    const group = d3Select(svg).append("g");
    group.call(control);
    return group.node() as SVGGElement;
  };

  const basic = () =>
    slider().scale(scale()).value(5).majorTicks([0, 5, 10]).minorTicks([2.5, 7.5]);

  const handle = (node: Element) => node.querySelector("g.sszvis-control-slider__handle");
  const handleBox = (node: Element) => node.querySelector("rect.sszvis-control-slider__handlebox");
  const handleLine = (node: Element) =>
    node.querySelector("line.sszvis-control-slider__handleline");
  const handleLabel = (node: Element) =>
    node.querySelector<SVGTextElement>("text.sszvis-control-slider--label");
  const ticks = (node: Element) => [...node.querySelectorAll("g.tick")];
  const tickLabels = (node: Element) =>
    [...node.querySelectorAll("g.tick text")].map((t) => t.textContent);

  test("should render a background group, an axis, a handle and an interaction layer", () => {
    const node = render(basic());
    expect(node.querySelector("g.sszvis-control-slider__backgroundgroup")).toBeTruthy();
    expect(node.querySelector("g.sszvis-axisGroup")).toBeTruthy();
    expect(node.querySelector("g.sszvis-slider__background")).toBeTruthy();
    expect(handle(node)).toBeTruthy();
    expect(node.querySelector("g.sszvis-control-slider--interactionLayer")).toBeTruthy();
  });

  test("should offset the axis below the slider track", () => {
    const node = render(basic());
    expect(node.querySelector("g.sszvis-axisGroup")?.getAttribute("transform")).toBe(
      "translate(0,28)"
    );
  });

  test("should give the axis the slider-specific classes", () => {
    const node = render(basic());
    const axis = node.querySelector("g.sszvis-axisGroup") as SVGGElement;
    for (const cls of ["sszvis-axis", "sszvis-axis--bottom", "sszvis-axis--slider"]) {
      expect(axis.classList.contains(cls)).toBe(true);
    }
  });

  test("should draw a tick for every major and minor tick value", () => {
    const node = render(basic());
    expect(ticks(node).length).toBe(5);
  });

  test("should label the major ticks only", () => {
    const node = render(basic());
    // Ticks are rendered in the order they were configured - all majors, then all
    // minors - rather than in track order, so the empty labels come last.
    expect(tickLabels(node)).toEqual(["0", "5", "10", "", ""]);
  });

  test("should render minor ticks shorter than major ticks", () => {
    const node = render(basic());
    const lengths = [...node.querySelectorAll("g.tick line")].map((l) => l.getAttribute("y2"));
    // majorTickSize is 12; the minor ticks are shortened to 4. Again in configured
    // order: the three majors first, then the two minors.
    expect(lengths).toEqual(["12", "12", "12", "4", "4"]);
  });

  test("should anchor the first and last major label inside the track", () => {
    const node = render(basic());
    const anchors = [...node.querySelectorAll<SVGTextElement>("g.tick text")]
      .filter((t) => t.textContent !== "")
      .map((t) => t.style.textAnchor);
    expect(anchors).toEqual(["start", "middle", "end"]);
  });

  test("should draw the track inset by half the track width at both ends", () => {
    const node = render(basic());
    const bg1 = node.querySelector("line.sszvis-slider__background__bg1") as SVGLineElement;
    // range [0, 300], inset by bgWidth / 2 = 3 at each end
    expect(bg1.getAttribute("x1")).toBe("3");
    expect(bg1.getAttribute("x2")).toBe("297");
    expect(bg1.style.strokeWidth).toBe("6");
  });

  test("should draw a narrower white track on top of the grey one", () => {
    const node = render(basic());
    const bg2 = node.querySelector("line.sszvis-slider__background__bg2") as SVGLineElement;
    expect(bg2.style.strokeWidth).toBe("5");
    expect(bg2.style.stroke).toBe("rgb(255, 255, 255)");
  });

  test("should centre the track vertically on a half pixel", () => {
    const node = render(basic());
    expect(node.querySelector("g.sszvis-slider__background")?.getAttribute("transform")).toBe(
      "translate(0,18.5)"
    );
  });

  test("should fill the track up to the current value", () => {
    const node = render(basic());
    const shadow = node.querySelector("line.sszvis-slider__backgroundshadow") as SVGLineElement;
    expect(shadow.getAttribute("x1")).toBe("3");
    // the handle scale runs from 5.5 to 294.5, so the midpoint is 150
    expect(shadow.getAttribute("x2")).toBe("150");
  });

  test("should position the handle at the current value", () => {
    const node = render(basic());
    expect(handle(node)?.getAttribute("transform")).toBe("translate(150.5,0.5)");
  });

  test("should move the handle when the value changes", () => {
    const node = render(basic().value(0));
    // the scale is inset by half the handle width so the handle stays inside the track
    expect(handle(node)?.getAttribute("transform")).toBe("translate(5.5,0.5)");
  });

  test("should draw a 10x23 rounded handle box straddling the track", () => {
    const node = render(basic());
    const box = handleBox(node) as SVGRectElement;
    expect(box.getAttribute("x")).toBe("-5");
    expect(box.getAttribute("y")).toBe("7");
    expect(box.getAttribute("width")).toBe("10");
    expect(box.getAttribute("height")).toBe("23");
    expect(box.getAttribute("rx")).toBe("2");
    expect(box.getAttribute("ry")).toBe("2");
  });

  test("should draw a grip line inside the handle box", () => {
    const node = render(basic());
    const line = handleLine(node) as SVGLineElement;
    expect(line.getAttribute("y1")).toBe("11");
    expect(line.getAttribute("y2")).toBe("26");
  });

  test("should accept any continuous numeric scale, not just a linear one", () => {
    // The slider only ever calls domain/range/copy on its scale, and the move behaviour
    // inverts through it, so d3's other continuous numeric scales work here too. Typed as
    // ScaleContinuousNumeric rather than ScaleLinear so the types do not narrow that.
    const node = render(
      slider()
        .scale(scaleLog().domain([1, 1000]).range([0, 300]))
        .value(10)
        .majorTicks([1, 1000])
    );
    // 10 sits at a third of the way along a log scale from 1 to 1000, inset by the handle
    const x = handle(node)?.getAttribute("transform");
    expect(x).toMatch(/^translate\(/);
    expect(Number(x?.match(/translate\(([\d.]+)/)?.[1])).toBeCloseTo(101.8, 0);
  });

  describe("handle label", () => {
    test("should show the current value by default", () => {
      const node = render(basic());
      expect(handleLabel(node)?.textContent).toBe("5");
    });

    test("should use a label function when one is given", () => {
      const node = render(basic().label((d) => `Year ${String(d)}`));
      expect(handleLabel(node)?.textContent).toBe("Year 5");
    });

    test("should centre the label over the handle inside the domain", () => {
      const node = render(basic());
      expect(handleLabel(node)?.style.textAnchor).toBe("middle");
      expect(handleLabel(node)?.getAttribute("dx")).toBe("0");
    });

    test("should push the label inwards at the domain ends", () => {
      const low = render(basic().value(0));
      expect(handleLabel(low)?.style.textAnchor).toBe("start");
      expect(handleLabel(low)?.getAttribute("dx")).toBe("-5");

      const high = render(basic().value(10));
      expect(handleLabel(high)?.style.textAnchor).toBe("end");
      expect(handleLabel(high)?.getAttribute("dx")).toBe("5");
    });
  });

  describe("slanted tick labels", () => {
    test("should nudge vertical labels into place", () => {
      const node = render(basic().slant("vertical"));
      const label = [...node.querySelectorAll("g.tick text")].find((t) => t.textContent === "5");
      expect(label?.getAttribute("dx")).toBe("-1.8em");
      expect(label?.getAttribute("dy")).toBe("-1.5em");
    });

    test("should nudge diagonal labels into place", () => {
      const node = render(basic().slant("diagonal"));
      const label = [...node.querySelectorAll("g.tick text")].find((t) => t.textContent === "5");
      expect(label?.getAttribute("dx")).toBe("-1.6em");
      expect(label?.getAttribute("dy")).toBe("0.2em");
    });

    test("should leave the axis anchoring alone when slanted", () => {
      const node = render(basic().slant("vertical"));
      const anchors = [...node.querySelectorAll<SVGTextElement>("g.tick text")]
        .filter((t) => t.textContent !== "")
        .map((t) => t.style.textAnchor);
      // the outer-label anchoring only runs for a horizontal slant
      expect(anchors).toEqual(["end", "end", "end"]);
    });

    test("should re-enable the outer anchoring for an explicit horizontal slant", () => {
      const node = render(basic().slant("horizontal"));
      const anchors = [...node.querySelectorAll<SVGTextElement>("g.tick text")]
        .filter((t) => t.textContent !== "")
        .map((t) => t.style.textAnchor);
      expect(anchors).toEqual(["start", "middle", "end"]);
    });
  });

  test("should format tick labels with tickLabels", () => {
    const node = render(basic().tickLabels((d) => `${String(d)}%`));
    expect(tickLabels(node).filter(Boolean)).toEqual(["0%", "5%", "10%"]);
  });

  test("should accept plain strings for label and tickLabels", () => {
    const node = render(basic().label("Fixed").tickLabels("tick"));
    expect(handleLabel(node)?.textContent).toBe("Fixed");
    expect(tickLabels(node).filter(Boolean)).toEqual(["tick", "tick", "tick"]);
  });

  test("should not throw on a drag when no onchange is configured", () => {
    const node = render(slider().scale(scale()).value(5));
    const layer = node.querySelector(
      "g.sszvis-control-slider--interactionLayer rect"
    ) as SVGRectElement;
    layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(() =>
      layer.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 5 }))
    ).not.toThrow();
  });

  test("should place the interaction layer above the handle", () => {
    const node = render(basic());
    const classes = [...node.children].map((c) => c.getAttribute("class"));
    expect(classes.indexOf("sszvis-control-slider--interactionLayer")).toBeGreaterThan(
      classes.indexOf("sszvis-control-slider__handle")
    );
  });

  test("should default to no ticks at all", () => {
    const node = render(slider().scale(scale()).value(5));
    expect(ticks(node).length).toBe(0);
  });

  test("should call onchange while the handle is dragged", () => {
    const onchange = vi.fn();
    const node = render(basic().onchange(onchange));
    const layer = node.querySelector(
      "g.sszvis-control-slider--interactionLayer rect"
    ) as SVGRectElement;
    layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    layer.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 5 }));
    expect(onchange).toHaveBeenCalled();
  });

  describe("known quirks", () => {
    test("re-rendering appends another handle label every time", () => {
      // BUG: the handle group is joined idempotently, but `handle.append("text")` runs on
      // every render, so a slider that re-renders - which it must, since it does not
      // manage its own state - grows one extra label element per render. Only the first
      // is ever updated, because the label selection below uses `.data()` without a join,
      // so the extra copies keep the text they were created with (empty).
      // current: N labels after N renders. expected: append into the enter selection, or
      // join the label like the handle box and grip line.
      const control = basic();
      const group = d3Select(svg).append("g");
      group.call(control);
      group.call(control);
      group.call(control);
      const node = group.node() as SVGGElement;
      expect(node.querySelectorAll("g.sszvis-control-slider__handle").length).toBe(1);
      expect(node.querySelectorAll("text.sszvis-control-slider--label").length).toBe(3);
      expect(
        [...node.querySelectorAll("text.sszvis-control-slider--label")].map((t) => t.textContent)
      ).toEqual(["5", "", ""]);
    });

    test("the label is not re-selected after a value change, so only the first copy updates", () => {
      // BUG (same root cause): `.selectAll(...).data((d) => [d])` without `.join()` only
      // ever touches elements that already existed, so a re-render with a new value
      // updates the first label and leaves the accumulated ones blank.
      const group = d3Select(svg).append("g");
      group.call(basic().value(0));
      group.call(basic().value(10));
      const node = group.node() as SVGGElement;
      const labels = [...node.querySelectorAll("text.sszvis-control-slider--label")];
      expect(labels.map((t) => t.textContent)).toEqual(["10", ""]);
    });

    test("the outer label anchoring follows configuration order, not track order", () => {
      // BUG: the first and last major labels are anchored "start" and "end" by their
      // index in the rendered tick selection, which is the order the ticks were
      // configured in - not their position along the track. Major ticks given out of
      // order therefore anchor the wrong labels inwards.
      // current: anchoring by array position. expected: anchor by scale position, or
      // sort the tick values before rendering.
      const node = render(basic().majorTicks([10, 0, 5]));
      const anchors = [...node.querySelectorAll<SVGTextElement>("g.tick text")]
        .filter((t) => t.textContent !== "")
        .map((t) => [t.textContent, t.style.textAnchor]);
      expect(anchors).toEqual([
        ["10", "start"],
        ["0", "middle"],
        ["5", "end"],
      ]);
    });

    test("duplicate tick values survive deduplication when they are distinct objects", () => {
      // NOTE: the tick values are deduplicated with fn.set, which also compares by
      // identity, so the same date given once as a major and once as a minor tick is
      // drawn twice, one tick on top of the other.
      const domain: [Date, Date] = [new Date(2020, 0, 1), new Date(2020, 0, 31)];
      const node = render(
        slider()
          .scale(scaleTime().domain(domain).range([0, 300]))
          .value(domain[0])
          .majorTicks([new Date(2020, 0, 15)])
          .minorTicks([new Date(2020, 0, 15)])
      );
      const drawn = ticks(node);
      expect(drawn.length).toBe(2);
      // both sit at exactly the same place, and only the major one is labelled
      expect(drawn[0]?.getAttribute("transform")).toBe(drawn[1]?.getAttribute("transform"));
      expect(drawn.map((t) => t.querySelector("text")?.textContent)).toEqual([
        expect.any(String),
        "",
      ]);
    });

    test("a value outside the domain places the handle outside the track", () => {
      // NOTE: the value is not clamped, so a state value beyond the scale's domain draws
      // the handle past the end of the track rather than pinning it to the end.
      const node = render(basic().value(20));
      expect(handle(node)?.getAttribute("transform")).toBe("translate(583.5,0.5)");
    });

    test("the handle label compares against the domain by string, not by identity", () => {
      // NOTE: the anchoring uses fn.stringEqual rather than ===, which is what makes it
      // work for time scales: a value that is a different Date object for the same
      // instant as the domain endpoint is still recognised as that endpoint. The flip
      // side is that anything stringifying like an endpoint is treated as one.
      const domain: [Date, Date] = [new Date(2020, 0, 1), new Date(2020, 0, 31)];
      const node = render(
        slider()
          .scale(scaleTime().domain(domain).range([0, 300]))
          // an equal-but-distinct Date, as a rebuilt state value would be
          .value(new Date(2020, 0, 1))
      );
      expect(handleLabel(node)?.style.textAnchor).toBe("start");
    });

    test("a missing value throws after the control has been half-built", () => {
      // BUG: unlike `scale`, which is read first and so fails cleanly, `value` is only
      // needed once the handle is being labelled - by which point the background, the
      // axis and the handle have all been appended. A slider rendered before its state
      // exists therefore leaves a broken half-slider on screen.
      // current: partial DOM plus a TypeError from fn.stringEqual. expected: fail before
      // rendering, or treat a missing value as "no handle".
      const node = d3Select(svg).append("g");
      expect(() => node.call(slider().scale(scale()))).toThrow(TypeError);
      const el = node.node() as SVGGElement;
      expect(el.querySelector("g.sszvis-control-slider__backgroundgroup")).toBeTruthy();
      expect(el.querySelector("g.sszvis-control-slider__handle")).toBeTruthy();
      expect(el.querySelector("g.sszvis-control-slider--interactionLayer")).toBeNull();
    });

    test("a reversed range mirrors the control", () => {
      // BUG: sszvis.scale.range returns the extent of the range sorted ascending, so the
      // direction of a descending range is thrown away when alteredScale is built. A
      // slider on a right-to-left scale draws its ticks and handle mirrored, while the
      // interaction layer still inverts through the original, un-mirrored scale.
      // current: value 0 draws at the left end of a scale whose range starts at 300.
      // expected: preserve the range direction when insetting.
      const reversed = scaleLinear().domain([0, 10]).range([300, 0]);
      const node = render(slider().scale(reversed).value(0).majorTicks([0, 10]));
      // props.scale(0) is 300, but the handle is drawn at the left-hand inset instead
      expect(reversed(0)).toBe(300);
      expect(handle(node)?.getAttribute("transform")).toBe("translate(5.5,0.5)");
    });

    test("a single major tick is anchored to its start rather than centred", () => {
      // BUG: the anchoring branch tests `i === 0` before `i === numTicks - 1`, so the one
      // and only major label takes the "first label" branch and is anchored "start"
      // instead of "middle".
      // current: start. expected: middle when there is only one label.
      const node = render(basic().majorTicks([5]));
      const label = [...node.querySelectorAll<SVGTextElement>("g.tick text")].find(
        (t) => t.textContent === "5"
      );
      expect(label?.style.textAnchor).toBe("start");
    });

    test("the interaction layer inverts through the uninset scale", () => {
      // BUG: the handle is drawn with `alteredScale`, which is inset by half the handle
      // width at each end, but the move behaviour is given `props.scale`. Pointing at the
      // pixel where the handle for the domain maximum is drawn therefore reports a value
      // short of that maximum, so a drag can never reach either end of the domain.
      // current: the two scales disagree by up to 5.5px. expected: hand the move
      // behaviour the same scale the handle is positioned with.
      const onchange = vi.fn();
      const node = render(basic().onchange(onchange));
      const layer = node.querySelector(
        "g.sszvis-control-slider--interactionLayer rect"
      ) as SVGRectElement;
      const box = layer.getBoundingClientRect();
      layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      layer.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          // 294.5 is where the handle sits for the domain maximum; clientX is an integer
          clientX: box.left + 294,
          clientY: box.top + 20,
        })
      );
      expect(onchange).toHaveBeenCalled();
      // the move behaviour calls its handlers as (event, x, y)
      const reported = onchange.mock.calls.at(-1)?.[1] as number;
      expect(reported).toBeLessThan(10);
      expect(reported).toBeCloseTo(294 / 30, 5);
    });

    test("the interaction layer reports a meaningless second argument", () => {
      // NOTE: the move behaviour is given a y-scale with a range but no domain, so the
      // y value handed to onchange is inverted through the default [0, 1] domain and
      // means nothing. Handlers must ignore it.
      const onchange = vi.fn();
      const node = render(basic().onchange(onchange));
      const layer = node.querySelector(
        "g.sszvis-control-slider--interactionLayer rect"
      ) as SVGRectElement;
      expect(layer.getAttribute("height")).toBe("51");
      const box = layer.getBoundingClientRect();
      layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      layer.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: box.left + 150,
          clientY: box.top + 25,
        })
      );
      const y = onchange.mock.calls.at(-1)?.[2] as number;
      // a fraction of the layer's own height rather than anything in data space
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    });

    test("a missing scale throws before anything is rendered", () => {
      // NOTE: `scale` has no default, so rendering before it is configured throws while
      // reading the domain, leaving no partial control behind. This matches the other
      // controls' "required props are not defaulted" contract.
      expect(() => render(slider().value(5))).toThrow(TypeError);
      expect(svg.querySelector("g.sszvis-control-slider__backgroundgroup")).toBeNull();
    });
  });
});
