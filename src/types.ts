/**
 * Common TypeScript types used across sszvis modules
 *
 * @module sszvis/types
 */

import type { BaseType, NumberValue, Selection } from "d3";

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
 * A selection of `E` holding `D`, whose parent parameters are left unstated.
 *
 * Returned by the layer factories: the layer may have been derived from the caller's own
 * selection or from one selected from a string or a node, so its parent is not one fixed
 * type. The element and datum - all a caller uses - stay precise.
 */
export type LayerSelection<E extends BaseType, D> = Selection<E, D, BaseType, unknown>;

/**
 * A selection whose element and parent types are unstated, holding `T`.
 *
 * Suitable as a variable or return type. It is NOT suitable as a parameter type for
 * "accepts any selection": d3's Selection is invariant in all four of its type parameters,
 * so a concrete selection does not assign to this one. A function accepting any selection
 * has to be generic over d3's parameters instead - see textWrap or ensureDefsElement.
 */
export type AnySelection<T = unknown> = Selection<BaseType, T, BaseType, unknown>;

/**
 * Type for elements that can be selected - CSS selector string or d3 selection
 */
/**
 * What the layer factories and app() accept as a target: a CSS selector, or a selection.
 *
 * The selection parameters are part of the signature rather than fixed here, because d3's
 * Selection is invariant in all four - a non-generic union member would only accept
 * selections that happen to match it exactly.
 */
export type SelectableElement<
  G extends BaseType = BaseType,
  D = unknown,
  P extends BaseType = BaseType,
  PD = unknown,
> = string | Selection<G, D, P, PD>;

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
