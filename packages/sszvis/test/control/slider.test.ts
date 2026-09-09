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
  /** How the handle's own label is anchored against the handle box. */
  const labelAnchor = (node: Element) => [
    handleLabel(node)?.style.textAnchor,
    handleLabel(node)?.getAttribute("dx"),
  ];
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
      "translate(0,28)",
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
    // Ticks are rendered in track order, so the unlabelled minors sit between the majors.
    expect(tickLabels(node)).toEqual(["0", "", "5", "", "10"]);
  });

  test("should render minor ticks shorter than major ticks", () => {
    const node = render(basic());
    const lengths = [...node.querySelectorAll("g.tick line")].map((l) => l.getAttribute("y2"));
    // majorTickSize is 12; the minor ticks are shortened to 4. In track order:
    // 0, 2.5, 5, 7.5, 10.
    expect(lengths).toEqual(["12", "4", "12", "4", "12"]);
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
      "translate(0,18.5)",
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
        .majorTicks([1, 1000]),
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

    test("should keep a single, correct label across re-renders", () => {
      const control = basic();
      const group = d3Select(svg).append("g");
      group.call(control);
      group.call(control);
      group.call(control);
      const node = group.node() as SVGGElement;
      expect(node.querySelectorAll("g.sszvis-control-slider__handle").length).toBe(1);
      expect(node.querySelectorAll("text.sszvis-control-slider--label").length).toBe(1);
      expect(handleLabel(node)?.textContent).toBe("5");
    });

    test("should re-label the single handle label after a value change", () => {
      const group = d3Select(svg).append("g");
      group.call(basic().value(0));
      group.call(basic().value(10));
      const node = group.node() as SVGGElement;
      expect(
        [...node.querySelectorAll("text.sszvis-control-slider--label")].map((t) => t.textContent),
      ).toEqual(["10"]);
    });

    test("should not adopt a label element that belongs to something else", () => {
      const group = d3Select(svg).append("g");
      // a stray label outside the handle group, as another render might leave behind
      const foreign = group
        .append("text")
        .attr("class", "sszvis-control-slider--label")
        .text("foreign");
      group.call(basic());
      const node = group.node() as SVGGElement;
      expect(foreign.text()).toBe("foreign");
      const handleGroup = handle(node) as SVGGElement;
      expect(handleGroup.querySelectorAll("text.sszvis-control-slider--label").length).toBe(1);
      expect(handleGroup.querySelector("text.sszvis-control-slider--label")?.textContent).toBe("5");
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
      "g.sszvis-control-slider--interactionLayer rect",
    ) as SVGRectElement;
    layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(() =>
      layer.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 5 })),
    ).not.toThrow();
  });

  test("should place the interaction layer above the handle", () => {
    const node = render(basic());
    const classes = [...node.children].map((c) => c.getAttribute("class"));
    expect(classes.indexOf("sszvis-control-slider--interactionLayer")).toBeGreaterThan(
      classes.indexOf("sszvis-control-slider__handle"),
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
      "g.sszvis-control-slider--interactionLayer rect",
    ) as SVGRectElement;
    layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    layer.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 5 }));
    expect(onchange).toHaveBeenCalled();
  });

  describe("tick label anchoring", () => {
    test("should anchor by track position, not by configuration order", () => {
      const node = render(basic().majorTicks([10, 0, 5]));
      const anchors = [...node.querySelectorAll<SVGTextElement>("g.tick text")]
        .filter((t) => t.textContent !== "")
        .map((t) => [t.textContent, t.style.textAnchor]);
      expect(anchors).toEqual([
        ["0", "start"],
        ["5", "middle"],
        ["10", "end"],
      ]);
    });

    test("should centre a lone major label", () => {
      const node = render(basic().majorTicks([5]));
      const label = [...node.querySelectorAll<SVGTextElement>("g.tick text")].find(
        (t) => t.textContent === "5",
      );
      expect(label?.style.textAnchor).toBe("middle");
    });

    test("should anchor both labels inwards when there are only two", () => {
      const node = render(slider().scale(scale()).value(5).majorTicks([0, 10]));
      const anchors = [...node.querySelectorAll<SVGTextElement>("g.tick text")]
        .filter((t) => t.textContent !== "")
        .map((t) => t.style.textAnchor);
      expect(anchors).toEqual(["start", "end"]);
    });

    test("should not throw when there are no major ticks at all", () => {
      expect(() => render(slider().scale(scale()).value(5).minorTicks([2.5, 7.5]))).not.toThrow();
      const node = render(slider().scale(scale()).value(5).minorTicks([2.5, 7.5]));
      expect(tickLabels(node)).toEqual(["", ""]);
    });
  });

  describe("value clamping and validation", () => {
    test("should pin the handle to the end of the track for a value above the domain", () => {
      const node = render(basic().value(20));
      expect(handle(node)?.getAttribute("transform")).toBe("translate(294.5,0.5)");
    });

    test("should pin the handle to the start of the track for a value below the domain", () => {
      const node = render(basic().value(-20));
      expect(handle(node)?.getAttribute("transform")).toBe("translate(5.5,0.5)");
    });

    test("should throw before rendering anything when value is missing", () => {
      const node = d3Select(svg).append("g");
      expect(() => node.call(slider().scale(scale()))).toThrow(/value/);
      const el = node.node() as SVGGElement;
      expect(el.childElementCount).toBe(0);
    });

    test("should name the component and the property in that error", () => {
      const node = d3Select(svg).append("g");
      expect(() => node.call(slider().scale(scale()))).toThrow(
        "[sszvis.control.slider] the `value` property is required",
      );
    });
  });

  describe("drag round trip", () => {
    /** Drags to `offset` pixels into the interaction layer and returns the reported x. */
    const dragTo = (node: SVGGElement, onchange: ReturnType<typeof vi.fn>, offset: number) => {
      const layer = node.querySelector(
        "g.sszvis-control-slider--interactionLayer rect",
      ) as SVGRectElement;
      const box = layer.getBoundingClientRect();
      layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      layer.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: box.left + offset,
          clientY: box.top + 20,
        }),
      );
      expect(onchange).toHaveBeenCalled();
      // the move behaviour calls its handlers as (event, x, y)
      return onchange.mock.calls.at(-1)?.[1];
    };

    test("should keep the interaction layer spanning the whole configured range", () => {
      const node = render(basic());
      const layer = node.querySelector(
        "g.sszvis-control-slider--interactionLayer rect",
      ) as SVGRectElement;
      expect(layer.getAttribute("x")).toBe("0");
      expect(layer.getAttribute("width")).toBe("300");
    });

    test("should report the domain maximum at the pixel its handle is drawn at", () => {
      const onchange = vi.fn();
      const node = render(basic().onchange(onchange));
      // 294.5 is where the handle sits for the domain maximum; clientX is an integer
      expect(dragTo(node, onchange, 294) as number).toBeCloseTo(10, 1);
    });

    test("should report the domain minimum at the low end of the track", () => {
      const onchange = vi.fn();
      const node = render(basic().onchange(onchange));
      expect(dragTo(node, onchange, 5) as number).toBe(0);
    });

    test("should round trip through a time scale at both ends", () => {
      const domain: [Date, Date] = [new Date(2020, 0, 1), new Date(2020, 0, 31)];
      const onchange = vi.fn();
      const node = render(
        slider()
          .scale(scaleTime().domain(domain).range([0, 300]))
          .value(domain[0])
          .onchange(onchange),
      );
      expect(+(dragTo(node, onchange, 5) as Date)).toBe(+domain[0]);
      const high = dragTo(node, onchange, 294) as Date;
      // within a pixel of the end, which on a 30-day domain is a couple of hours
      expect(+domain[1] - +high).toBeLessThan(2 * 60 * 60 * 1000);
    });

    test("should agree with its own rendering on a reversed scale", () => {
      const reversed = scaleLinear().domain([0, 10]).range([300, 0]);
      const onchange = vi.fn();
      const node = render(slider().scale(reversed).value(0).onchange(onchange));
      // the handle for value 0 is drawn at the right-hand inset
      expect(handle(node)?.getAttribute("transform")).toBe("translate(294.5,0.5)");
      // and pointing there reports 0, not 10
      expect(dragTo(node, onchange, 294) as number).toBeCloseTo(0, 1);
      expect(dragTo(node, onchange, 5) as number).toBeCloseTo(10, 1);
    });
  });

  describe("reversed range", () => {
    test("should draw the handle at the right-hand end for the domain minimum", () => {
      const reversed = scaleLinear().domain([0, 10]).range([300, 0]);
      const node = render(slider().scale(reversed).value(0).majorTicks([0, 10]));
      expect(reversed(0)).toBe(300);
      expect(handle(node)?.getAttribute("transform")).toBe("translate(294.5,0.5)");
    });

    test("should draw the ticks right to left", () => {
      const reversed = scaleLinear().domain([0, 10]).range([300, 0]);
      const node = render(slider().scale(reversed).value(0).majorTicks([0, 10]));
      const labelled = [...node.querySelectorAll<SVGTextElement>("g.tick text")].filter(
        (t) => t.textContent !== "",
      );
      // in track order: 10 on the left, 0 on the right
      expect(labelled.map((t) => [t.textContent, t.style.textAnchor])).toEqual([
        ["10", "start"],
        ["0", "end"],
      ]);
    });

    test("should anchor the handle label into the track, not by domain order", () => {
      // The anchor comes from the pixel the handle is drawn at. With a descending range the
      // domain minimum is drawn at the right-hand end, so it has to be anchored "end" and
      // nudged left; keying off the domain index anchored it "start" and pushed a long
      // label off the track.
      const reversed = () => scaleLinear().domain([0, 10]).range([300, 0]);
      expect(labelAnchor(render(slider().scale(reversed()).value(0)))).toEqual(["end", "5"]);
      expect(labelAnchor(render(slider().scale(reversed()).value(10)))).toEqual(["start", "-5"]);
      // and the ascending case is the mirror image of it
      const ascending = () => scaleLinear().domain([0, 10]).range([0, 300]);
      expect(labelAnchor(render(slider().scale(ascending()).value(0)))).toEqual(["start", "-5"]);
      expect(labelAnchor(render(slider().scale(ascending()).value(10)))).toEqual(["end", "5"]);
      // anything in between stays centred over its handle
      expect(labelAnchor(render(slider().scale(ascending()).value(5)))).toEqual(["middle", "0"]);
    });

    test("should anchor an out-of-domain value at the end it is clamped to", () => {
      // The clamp pins the handle to an end, but the value equals neither bound, so a
      // domain-keyed anchor centred the label over the edge of the track.
      const scale = () => scaleLinear().domain([0, 10]).range([0, 300]);
      expect(labelAnchor(render(slider().scale(scale()).value(-5)))).toEqual(["start", "-5"]);
      expect(labelAnchor(render(slider().scale(scale()).value(99)))).toEqual(["end", "5"]);
    });

    test("should keep the direction of a descending time range", () => {
      const domain: [Date, Date] = [new Date(2020, 0, 1), new Date(2020, 0, 31)];
      const node = render(
        slider()
          .scale(scaleTime().domain(domain).range([300, 0]))
          .value(domain[0])
          .majorTicks([domain[0], domain[1]]),
      );
      expect(handle(node)?.getAttribute("transform")).toBe("translate(294.5,0.5)");
    });
  });

  describe("known quirks", () => {
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
          .minorTicks([new Date(2020, 0, 15)]),
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
          .value(new Date(2020, 0, 1)),
      );
      expect(handleLabel(node)?.style.textAnchor).toBe("start");
    });

    test("the interaction layer reports a meaningless second argument", () => {
      // NOTE: the move behaviour is given a y-scale with a range but no domain, so the
      // y value handed to onchange is inverted through the default [0, 1] domain and
      // means nothing. Handlers must ignore it.
      const onchange = vi.fn();
      const node = render(basic().onchange(onchange));
      const layer = node.querySelector(
        "g.sszvis-control-slider--interactionLayer rect",
      ) as SVGRectElement;
      expect(layer.getAttribute("height")).toBe("51");
      const box = layer.getBoundingClientRect();
      layer.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      layer.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: box.left + 150,
          clientY: box.top + 25,
        }),
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
