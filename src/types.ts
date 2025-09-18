/**
 * Common TypeScript types used across sszvis modules
 *
 * @module sszvis/types
 */

import type { Selection } from "d3";

/**
 * Generic type for SVG element selections with sensible defaults
 */
export type SVGElementSelection<T extends SVGElement> = Selection<T, unknown, null, undefined>;

/**
 * Generic selection type with default parameters
 */
export type AnySelection = Selection<any, any, any, any>;

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
  bounds?: any;
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
