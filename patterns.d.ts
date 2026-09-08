/**
 * Patterns module
 *
 * @module sszvis/patterns
 *
 * This module contains svg patterns and pattern helper functions which are used
 * to render important textures for various other components.
 *
 * Every helper here is idempotent: the contents are data-joined rather than appended, so calling a
 * helper again on the same element updates that element's contents in place instead of adding a
 * second copy. Map renderers re-derive their definition selection on every render and `call` these
 * helpers unconditionally, so appending would grow the definition without bound.
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
/** The default id `mapLakeFadeGradient` defines and `mapLakeGradientMask` references. */
export declare const LAKE_FADE_GRADIENT_ID = "lake-fade-gradient";
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
 *
 * The id it writes is the one `mapLakeGradientMask` has to be pointed at. It defaults to the
 * historical fixed id, so an unparameterised call is unchanged; pass an id to scope the definition
 * to one map rather than rewriting the attribute afterwards. Because it is a trailing parameter it
 * can also be handed over as `selection.call(mapLakeFadeGradient, id)`.
 *
 * @param selection A d3 selection of SVG linear gradient elements
 * @param gradientId The id to write on the gradient. Defaults to `lake-fade-gradient`.
 */
export declare const mapLakeFadeGradient: <D, P extends BaseType, PD>(selection: Selection<SVGLinearGradientElement, D, P, PD>, gradientId?: string) => void;
/**
 * The gradient alpha fade mask for the Lake Zurich shape
 *
 * The mask fades the lake by filling itself with the fade gradient, so it is only useful beside a
 * `mapLakeFadeGradient` that defines the id given here; the two must be scoped together. The id
 * defaults to the historical fixed one, and is written on every call, so a later call with a new id
 * repoints the existing rect.
 *
 * @param selection A d3 selection of SVG mask elements
 * @param gradientId The id of the gradient to fill the mask with. Defaults to `lake-fade-gradient`.
 */
export declare const mapLakeGradientMask: <D, P extends BaseType, PD>(selection: Selection<SVGMaskElement, D, P, PD>, gradientId?: string) => void;
/**
 * The pattern for the data area texture
 * @param selection A d3 selection of SVG pattern elements
 */
export declare const dataAreaPattern: <D, P extends BaseType, PD>(selection: Selection<SVGPatternElement, D, P, PD>) => void;
//# sourceMappingURL=patterns.d.ts.map