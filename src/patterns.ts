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
export const heatTableMissingValuePattern = (selection: PatternSelection): void => {
  const rectFill = "#FAFAFA", // Light grey color directly
    crossStroke = "#A4A4A4",
    crossStrokeWidth = 0.035,
    cross1 = 0.35,
    cross2 = 0.65;

  selection
    .attr("patternUnits", "objectBoundingBox")
    .attr("patternContentUnits", "objectBoundingBox")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1);

  selection
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1)
    .attr("fill", rectFill);

  selection
    .append("line")
    .attr("x1", cross1)
    .attr("y1", cross1)
    .attr("x2", cross2)
    .attr("y2", cross2)
    .attr("stroke-width", crossStrokeWidth)
    .attr("stroke", crossStroke);

  selection
    .append("line")
    .attr("x1", cross2)
    .attr("y1", cross1)
    .attr("x2", cross1)
    .attr("y2", cross2)
    .attr("stroke-width", crossStrokeWidth)
    .attr("stroke", crossStroke);
};

/**
 * The pattern for the map areas which are missing values
 * @param selection A d3 selection of SVG pattern elements
 */
export const mapMissingValuePattern = (selection: PatternSelection): void => {
  const pWidth = 14,
    pHeight = 14,
    fillColor = "#FAFAFA",
    lineStroke = "#CCCCCC";

  selection
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight);

  selection
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight)
    .attr("fill", fillColor);

  selection
    .append("line")
    .attr("x1", 1)
    .attr("y1", 10)
    .attr("x2", 5)
    .attr("y2", 14)
    .attr("stroke", lineStroke);

  selection
    .append("line")
    .attr("x1", 5)
    .attr("y1", 10)
    .attr("x2", 1)
    .attr("y2", 14)
    .attr("stroke", lineStroke);

  selection
    .append("line")
    .attr("x1", 8)
    .attr("y1", 3)
    .attr("x2", 12)
    .attr("y2", 7)
    .attr("stroke", lineStroke);

  selection
    .append("line")
    .attr("x1", 12)
    .attr("y1", 3)
    .attr("x2", 8)
    .attr("y2", 7)
    .attr("stroke", lineStroke);
};

/**
 * The pattern for Lake Zurich in the map component
 * @param selection A d3 selection of SVG pattern elements
 */
export const mapLakePattern = (selection: PatternSelection): void => {
  const pWidth = 6;
  const pHeight = 6;
  const offset = 0.5;

  selection
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight);

  selection
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight)
    .attr("fill", "#fff");

  selection
    .append("line")
    .attr("x1", 0)
    .attr("y1", pHeight * offset)
    .attr("x2", pWidth * offset)
    .attr("y2", 0)
    .attr("stroke", "#ddd")
    .attr("stroke-linecap", "square");

  selection
    .append("line")
    .attr("x1", pWidth * offset)
    .attr("y1", pHeight)
    .attr("x2", pWidth)
    .attr("y2", pHeight * offset)
    .attr("stroke", "#ddd")
    .attr("stroke-linecap", "square");
};

/**
 * The gradient used by the alpha fade pattern in the Lake Zurich shape
 * @param selection A d3 selection of SVG linear gradient elements
 */
export const mapLakeFadeGradient = (selection: LinearGradientSelection): void => {
  selection
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0.55)
    .attr("y2", 1)
    .attr("id", "lake-fade-gradient");

  selection.append("stop").attr("offset", 0.74).attr("stop-color", "white").attr("stop-opacity", 1);

  selection.append("stop").attr("offset", 0.97).attr("stop-color", "white").attr("stop-opacity", 0);
};

/**
 * The gradient alpha fade mask for the Lake Zurich shape
 * @param selection A d3 selection of SVG mask elements
 */
export const mapLakeGradientMask = (selection: MaskSelection): void => {
  selection.attr("maskContentUnits", "objectBoundingBox");

  selection
    .append("rect")
    .attr("fill", "url(#lake-fade-gradient)")
    .attr("width", 1)
    .attr("height", 1);
};

/**
 * The pattern for the data area texture
 * @param selection A d3 selection of SVG pattern elements
 */
export const dataAreaPattern = (selection: PatternSelection): void => {
  const pWidth = 6;
  const pHeight = 6;
  const offset = 0.5;

  selection
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", pWidth)
    .attr("height", pHeight);

  selection
    .append("line")
    .attr("x1", 0)
    .attr("y1", pHeight * offset)
    .attr("x2", pWidth * offset)
    .attr("y2", 0)
    .attr("stroke", "#e6e6e6")
    .attr("stroke-width", 1.1);

  selection
    .append("line")
    .attr("x1", pWidth * offset)
    .attr("y1", pHeight)
    .attr("x2", pWidth)
    .attr("y2", pHeight * offset)
    .attr("stroke", "#e6e6e6")
    .attr("stroke-width", 1.1);
};
