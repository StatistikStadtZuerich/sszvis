/**
 * Patterns module
 *
 * @module sszvis/patterns
 *
 * This module contains svg patterns and pattern helper functions which are used
 * to render important textures for various other components.
 *
 * @method  heatTableMissingValuePattern    The pattern for the missing values in the heat table
 * @method  mapMissingValuePattern          The pattern for the map areas which are missing values. Used by map.js internally
 * @method  mapLakePattern                  The pattern for Lake Zurich in the map component. Used by map.js internally
 * @method  mapLakeFadeGradient             The pattern which provides a gradient, used by the alpha fade pattern,
 *                                          in the Lake Zurich shape. Used by map.js internally
 * @method  mapLakeGradientMask             The pattern which provides a gradient alpha fade for the Lake Zurich shape.
 *                                           It uses the fadeGradient pattern to create an alpha gradient mask. Used by map.js internally
 * @method  dataAreaPattern                 The pattern for the data area texture.
 *
 */
import type { LinearGradientSelection, MaskSelection, PatternSelection } from "./types";
/**
 * The pattern for the missing values in the heat table
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const heatTableMissingValuePattern: (selection: PatternSelection) => void;
/**
 * The pattern for the map areas which are missing values
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const mapMissingValuePattern: (selection: PatternSelection) => void;
/**
 * The pattern for Lake Zurich in the map component
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const mapLakePattern: (selection: PatternSelection) => void;
/**
 * The gradient used by the alpha fade pattern in the Lake Zurich shape
 * @param selection A d3 selection of SVG linear gradient elements
 */
export declare const mapLakeFadeGradient: (selection: LinearGradientSelection) => void;
/**
 * The gradient alpha fade mask for the Lake Zurich shape
 * @param selection A d3 selection of SVG mask elements
 */
export declare const mapLakeGradientMask: (selection: MaskSelection) => void;
/**
 * The pattern for the data area texture
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const dataAreaPattern: (selection: PatternSelection) => void;
//# sourceMappingURL=patterns.d.ts.map