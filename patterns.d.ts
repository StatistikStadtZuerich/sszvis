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
import type { BaseType, Selection } from "d3";
/**
 * The pattern for the missing values in the heat table
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const heatTableMissingValuePattern: <D, P extends BaseType, PD>(selection: Selection<SVGPatternElement, D, P, PD>) => void;
/**
 * The pattern for the map areas which are missing values
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const mapMissingValuePattern: <D, P extends BaseType, PD>(selection: Selection<SVGPatternElement, D, P, PD>) => void;
/**
 * The pattern for Lake Zurich in the map component
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const mapLakePattern: <D, P extends BaseType, PD>(selection: Selection<SVGPatternElement, D, P, PD>) => void;
/**
 * The gradient used by the alpha fade pattern in the Lake Zurich shape
 * @param selection A d3 selection of SVG linear gradient elements
 */
export declare const mapLakeFadeGradient: <D, P extends BaseType, PD>(selection: Selection<SVGLinearGradientElement, D, P, PD>) => void;
/**
 * The gradient alpha fade mask for the Lake Zurich shape
 * @param selection A d3 selection of SVG mask elements
 */
export declare const mapLakeGradientMask: <D, P extends BaseType, PD>(selection: Selection<SVGMaskElement, D, P, PD>) => void;
/**
 * The pattern for the data area texture
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const dataAreaPattern: <D, P extends BaseType, PD>(selection: Selection<SVGPatternElement, D, P, PD>) => void;
//# sourceMappingURL=patterns.d.ts.map