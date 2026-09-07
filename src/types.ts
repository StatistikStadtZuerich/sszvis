/**
 * Common TypeScript types used across sszvis modules
 *
 * @module sszvis/types
 */

import type { NumberValue, Selection } from "d3";

/**
 * The one sanctioned `any` in this codebase. Use it where a type genuinely cannot be
 * expressed - d3 internals, variadic combinators, the untyped component core - and always
 * with a comment saying which. Everywhere else, prefer `unknown` and narrow.
 *
 * Named with a `$` so it is obvious at a glance and greppable: `rg '\$IntentionalAny'`
 * lists every remaining escape hatch.
 */
// biome-ignore lint/suspicious/noExplicitAny: the alias exists so that every other `any` can be banned
export type $IntentionalAny = any;

/**
 * Generic type for SVG element selections with sensible defaults
 */
export type SVGElementSelection<T extends SVGElement> = Selection<T, unknown, null, undefined>;

/**
 * Generic selection type with default parameters
 */
export type AnySelection<T = $IntentionalAny> = Selection<
  // d3 selections are invariant in their element and parent-datum parameters, so anything
  // narrower here stops the many selections this alias stands in for assigning to it.
  $IntentionalAny,
  T,
  $IntentionalAny,
  $IntentionalAny
>;

/**
 * Type for elements that can be selected - CSS selector string or d3 selection
 */
export type SelectableElement = string | AnySelection;

/**
 * Common selection type for general DOM elements
 */
export type ElementSelection<T extends Element = Element> = Selection<T, unknown, null, undefined>;

/**
 * Type for SVG pattern selections
 */
export type PatternSelection = SVGElementSelection<SVGPatternElement>;

/**
 * Type for SVG linear gradient selections
 */
export type LinearGradientSelection = SVGElementSelection<SVGLinearGradientElement>;

/**
 * Type for SVG mask selections
 */
export type MaskSelection = SVGElementSelection<SVGMaskElement>;

/**
 * A measurement object with width and screen height
 * This is the unified measurement interface used across sszvis
 */
export interface Measurement {
  width: number;
  screenHeight: number;
  screenWidth?: number;
  /** A bounds object, when the measurement came from one. Shape varies by caller. */
  bounds?: $IntentionalAny;
}

/**
 * A breakpoint definition with name and measurement constraints
 */
export interface Breakpoint {
  name: string;
  measurement: Measurement;
}

/**
 * Interface for dimension measurement results from measureDimensions
 */
export interface DimensionMeasurement {
  width: number | undefined;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Common accessor type for annotation components
 * Supports both constant values and accessor functions
 */
export type Accessor<T, R> = R | ((d: T) => R);

/**
 * Specific accessor types for common use cases in annotations
 */
export type NumberAccessor<T = unknown> = Accessor<T, NumberValue>;
export type StringAccessor<T = unknown> = Accessor<T, string>;
export type BooleanAccessor<T = unknown> = Accessor<T, boolean>;
