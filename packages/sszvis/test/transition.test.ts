import { easePolyOut } from "d3";
import { describe, expect, test } from "vitest";
import { defaultTransition, fastTransition, slowTransition } from "../src/transition.js";

/**
 * src/transition.ts is three factories over d3.transition(), so its whole contract is the
 * duration and the easing each one carries. That a d3 transition then animates a style,
 * completes, can be interrupted or honours a delay is d3's own behaviour; asserting it here
 * pinned nothing about sszvis and cost two wall-clock bounds (`< 150ms`, `> 140ms`) that were
 * flaky by construction. The components that actually depend on transition timing assert it
 * through rendered attributes instead - see the interrupt tests in component/bar,
 * component/pie and annotation/confidenceArea.
 */
describe("transition", () => {
  const factories: {
    name: string;
    make: () => { duration(): number; ease(): unknown };
    duration: number;
  }[] = [
    { name: "defaultTransition", make: defaultTransition, duration: 300 },
    { name: "fastTransition", make: fastTransition, duration: 50 },
    { name: "slowTransition", make: slowTransition, duration: 500 },
  ];

  for (const { name, make, duration } of factories) {
    test(`should give ${name} a ${duration}ms duration and the shared polynomial ease-out`, () => {
      expect(make().duration()).toBe(duration);
      // The previous version of this assertion only checked `typeof ease === "function"`,
      // which holds for d3's default easeCubicInOut as well and so never pinned the easing.
      expect(make().ease()).toBe(easePolyOut);
    });
  }

  test("should order the three durations fast, default, slow", () => {
    // The relative order is the reason three factories exist rather than one: a component
    // picks the one that suits the change it is animating.
    expect(fastTransition().duration()).toBeLessThan(defaultTransition().duration());
    expect(defaultTransition().duration()).toBeLessThan(slowTransition().duration());
  });
});
