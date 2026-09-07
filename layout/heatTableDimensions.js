import { objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { requireSize, requireCount } from './validate.js';

/** A table with no columns, no rows or no room: nothing to draw and nothing to report. */
const EMPTY_DIMENSIONS = {
  side: 0,
  paddedSide: 0,
  padRatio: 0,
  width: 0,
  height: 0,
  centeredOffset: 0
};
function dimensionsHeatTable(spaceWidth, squarePadding, numX, numY, chartPadding) {
  var _padding$left, _padding$right;
  requireSize("dimensionsHeatTable", "spaceWidth", spaceWidth);
  requireSize("dimensionsHeatTable", "squarePadding", squarePadding);
  requireCount("dimensionsHeatTable", "numX", numX);
  requireCount("dimensionsHeatTable", "numY", numY);
  if (spaceWidth === 0 || numX === 0 || numY === 0) return _objectSpread2({}, EMPTY_DIMENSIONS);
  // a copy: a dimension calculator has no business writing to its arguments
  const padding = _objectSpread2({}, chartPadding);
  padding.top || (padding.top = 0);
  padding.right || (padding.right = 0);
  padding.bottom || (padding.bottom = 0);
  padding.left || (padding.left = 0);
  // this includes the default side length for the heat table
  const DEFAULT_SIDE = 30,
    availableChartWidth = spaceWidth - ((_padding$left = padding.left) !== null && _padding$left !== void 0 ? _padding$left : 0) - ((_padding$right = padding.right) !== null && _padding$right !== void 0 ? _padding$right : 0),
    // the side is capped from above and floored at 0: a box cannot have a negative side,
    // and a padRatio derived from one lands outside the [0, 1) a band scale accepts
    side = Math.max(0, Math.min((availableChartWidth - squarePadding * (numX - 1)) / numX, DEFAULT_SIDE)),
    paddedSide = side + squarePadding,
    padRatio = 1 - side / paddedSide,
    tableWidth = numX * paddedSide - squarePadding,
    // subtract the squarePadding at the end
    tableHeight = numY * paddedSide - squarePadding; // subtract the squarePadding at the end
  // no room for a box means no table to lay out
  if (side === 0) return _objectSpread2({}, EMPTY_DIMENSIONS);
  return {
    side,
    paddedSide,
    padRatio,
    width: tableWidth,
    height: tableHeight,
    centeredOffset: Math.max((availableChartWidth - tableWidth) / 2, 0)
  };
}

export { dimensionsHeatTable as default };
//# sourceMappingURL=heatTableDimensions.js.map
