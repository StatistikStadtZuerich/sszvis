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
  // A non-positive step describes no band at all, and an infinite one - num and pct both 0,
  // or both 1, either of which divides by zero - yields NaN geometry. There is no layout to
  // describe in either case, so neither reaches the baseline loop. A degenerate height is not
  // a misconfiguration: it is what a container mid-entrance or a flex parent that has not
  // settled reports, and it corrects itself, so it is neither warned about nor thrown on.
  if (!(step > 0) || !Number.isFinite(step)) return _objectSpread2({}, EMPTY_LAYOUT);
  const bandHeight = step * (1 - padRatio),
    range = [];
  let level = bandHeight; // count from the top, and start at the bottom of the first band
  // Terminating on the stack count, not on a pixel slack: step * (num - pct) === height by
  // construction, so `num` baselines are exactly the ones that fit and the last of them lands
  // on `height`. The absolute 1px slack this replaces bought an extra iteration or two
  // whenever the step was under ~1px, and returned more baselines than there are stacks.
  while (range.length < num) {
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
