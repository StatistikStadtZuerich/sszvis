/**
 * Common TypeScript types used across sszvis modules
 *
 * @module sszvis/types
 */

import { Selection, BaseType } from "d3";

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