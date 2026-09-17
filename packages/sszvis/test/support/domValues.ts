import { color } from "d3";

/**
 * Readers for the two DOM values the suites kept asserting as exact strings.
 *
 * Both exist for the same reason: the tests were pinning a *spelling* where the *value* is the
 * contract. `#ff0000` and `rgb(255, 0, 0)` are the same colour, and `translate(52.5,30)` and
 * `translate(52.5, 30)` are the same position, but a string comparison fails when a renderer
 * switches between them for reasons no consumer can see.
 *
 * Where the exact literal genuinely is the contract - a generated id a mask has to reference, a
 * documented class name - the suites still compare strings directly.
 */

/**
 * A CSS colour in one canonical spelling, so `#ff0000` compares equal to `rgb(255, 0, 0)`.
 *
 * Anything d3 cannot parse - `""`, `null`, a keyword the test means to assert verbatim - comes
 * back untouched, so an unset style stays distinguishable from a transparent one.
 */
export function resolvedColor(value: string | null | undefined) {
  if (value == null) return value;
  const parsed = color(value);
  return parsed === null ? value : parsed.formatRgb();
}

/**
 * The x and y of a `transform` that starts with a `translate(...)`, as numbers.
 *
 * Returns null when there is no translation to read, so a missing transform fails as a null
 * rather than quietly comparing equal to an origin-placed element.
 */
export function translationOf(node: Element) {
  const transform = node.getAttribute("transform") ?? "";
  const match = /translate\(\s*(-?[\d.]+)\s*[ ,]\s*(-?[\d.]+)\s*\)/.exec(transform);
  return match === null ? null : { x: Number(match[1]), y: Number(match[2]) };
}
