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
export const LAKE_FADE_GRADIENT_ID = "lake-fade-gradient";

/** One line of a tile pattern, in the pattern's own content units. */
interface PatternLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** One stop of the lake fade gradient. */
interface GradientStop {
  offset: number;
  opacity: number;
}

/**
 * The pattern for the missing values in the heat table
 * @param selection A d3 selection of SVG pattern elements
 */
export const heatTableMissingValuePattern = <D, P extends BaseType, PD>(
  selection: Selection<SVGPatternElement, D, P, PD>,
): void => {
  const rectFill = "#FAFAFA", // Light grey color directly
    crossStroke = "#A4A4A4",
    crossStrokeWidth = 0.035,
    cross1 = 0.35,
    cross2 = 0.65;

  const lines: PatternLine[] = [
    { x1: cross1, y1: cross1, x2: cross2, y2: cross2 },
    { x1: cross2, y1: cross1, x2: cross1, y2: cross2 },
  ];

  selection
    .attr("patternUnits", "objectBoundingBox")
    .attr("patternContentUnits", "objectBoundingBox")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1);

  selection
    .selectAll<SVGRectElement, number>("rect")
    .data([0])
    .join("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1)
    .attr("fill", rectFill);

  selection
    .selectAll<SVGLineElement, PatternLine>("line")
    .data(lines)
    .join("line")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2)
    .attr("stroke-width", crossStrokeWidth)
    .attr("stroke", crossStroke);
};

/**
 * The pattern for the map areas which are missing values
 * @param selection A d3 selection of SVG pattern elements
 */
export const mapMissingValuePattern = <D, P extends BaseType, PD>(
  selection: Selection<SVGPatternElement, D, P, PD>,
): void => {
  const pWidth = 14,
    pHeight = 14,
    fillColor = "#FAFAFA",
    lineStroke = "#CCCCCC";

  const lines: PatternLine[] = [
    { x1: 1, y1: 10, x2: 5, y2: 14 },
    { x1: 5, y1: 10, x2: 1, y2: 14 },
    { x1: 8, y1: 3, x2: 12, y2: 7 },
    { x1: 12, y1: 3, x2: 8, y2: 7 },
  ];

  selection
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight);

  selection
    .selectAll<SVGRectElement, number>("rect")
    .data([0])
    .join("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight)
    .attr("fill", fillColor);

  selection
    .selectAll<SVGLineElement, PatternLine>("line")
    .data(lines)
    .join("line")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2)
    .attr("stroke", lineStroke);
};

/**
 * The pattern for Lake Zurich in the map component
 * @param selection A d3 selection of SVG pattern elements
 */
export const mapLakePattern = <D, P extends BaseType, PD>(
  selection: Selection<SVGPatternElement, D, P, PD>,
): void => {
  const pWidth = 6;
  const pHeight = 6;
  const offset = 0.5;

  const lines: PatternLine[] = [
    { x1: 0, y1: pHeight * offset, x2: pWidth * offset, y2: 0 },
    { x1: pWidth * offset, y1: pHeight, x2: pWidth, y2: pHeight * offset },
  ];

  selection
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight);

  selection
    .selectAll<SVGRectElement, number>("rect")
    .data([0])
    .join("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight)
    .attr("fill", "#fff");

  selection
    .selectAll<SVGLineElement, PatternLine>("line")
    .data(lines)
    .join("line")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2)
    .attr("stroke", "#ddd")
    .attr("stroke-linecap", "square");
};

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
export const mapLakeFadeGradient = <D, P extends BaseType, PD>(
  selection: Selection<SVGLinearGradientElement, D, P, PD>,
  gradientId: string = LAKE_FADE_GRADIENT_ID,
): void => {
  const stops: GradientStop[] = [
    { offset: 0.74, opacity: 1 },
    { offset: 0.97, opacity: 0 },
  ];

  selection.attr("x1", 0).attr("y1", 0).attr("x2", 0.55).attr("y2", 1).attr("id", gradientId);

  selection
    .selectAll<SVGStopElement, GradientStop>("stop")
    .data(stops)
    .join("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", "white")
    .attr("stop-opacity", (d) => d.opacity);
};

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
export const mapLakeGradientMask = <D, P extends BaseType, PD>(
  selection: Selection<SVGMaskElement, D, P, PD>,
  gradientId: string = LAKE_FADE_GRADIENT_ID,
): void => {
  selection.attr("maskContentUnits", "objectBoundingBox");

  selection
    .selectAll<SVGRectElement, number>("rect")
    .data([0])
    .join("rect")
    .attr("fill", `url(#${gradientId})`)
    .attr("width", 1)
    .attr("height", 1);
};

/**
 * The pattern for the data area texture
 * @param selection A d3 selection of SVG pattern elements
 */
export const dataAreaPattern = <D, P extends BaseType, PD>(
  selection: Selection<SVGPatternElement, D, P, PD>,
): void => {
  const pWidth = 6;
  const pHeight = 6;
  const offset = 0.5;

  const lines: PatternLine[] = [
    { x1: 0, y1: pHeight * offset, x2: pWidth * offset, y2: 0 },
    { x1: pWidth * offset, y1: pHeight, x2: pWidth, y2: pHeight * offset },
  ];

  selection
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight);

  selection
    .selectAll<SVGLineElement, PatternLine>("line")
    .data(lines)
    .join("line")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2)
    .attr("stroke", "#e6e6e6")
    .attr("stroke-width", 1.1);
};
