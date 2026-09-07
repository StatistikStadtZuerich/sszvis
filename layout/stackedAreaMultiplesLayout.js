import { objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { requireSize, requireCount, requireRatio } from './validate.js';

/** Nothing can be drawn: no baselines, and no band or padding to report. */
const EMPTY_LAYOUT = {
  range: [],
  bandHeight: 0,
  padHeight: 0
};
function layoutStackedAreaMultiples(height, num, pct) {
  requireSize("layoutStackedAreaMultiples", "height", height);
  requireCount("layoutStackedAreaMultiples", "num", num);
  const padRatio = pct !== null && pct !== void 0 ? pct : 0.1;
  requireRatio("layoutStackedAreaMultiples", "pct", padRatio);
  const step = height / (num - padRatio);
  // A non-positive step never reaches the bottom of the chart, so the baseline loop below
  // would never terminate. An infinite one - num and pct both 0, or both 1, either of
  // which divides by zero - overshoots on the first iteration and yields NaN geometry.
  // There is no layout to describe in either case.
  if (!(step > 0) || !Number.isFinite(step)) return _objectSpread2({}, EMPTY_LAYOUT);
  const bandHeight = step * (1 - padRatio),
    range = [];
  let level = bandHeight; // count from the top, and start at the bottom of the first band
  while (level - height < 1) {
    range.push(level);
    level += step;
  }
  return {
    range,
    bandHeight,
    padHeight: step * padRatio
  };
}

export { layoutStackedAreaMultiples as default };
//# sourceMappingURL=stackedAreaMultiplesLayout.js.map
