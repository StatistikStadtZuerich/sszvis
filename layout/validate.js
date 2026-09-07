/**
 * Argument checks shared by the layout functions.
 *
 * @module sszvis/layout/validate
 *
 * Every layout in this directory turns measurements and counts into geometry, and the two
 * degenerate cases they meet are distinguished here:
 *
 * - A size or a count that cannot describe any chart - negative, fractional where only whole
 *   items exist, or not a number at all - is a misconfiguration. It throws, naming the layout
 *   and the argument, before any dimension is computed.
 * - A zero size or a zero count is an ordinary runtime state: a container measured before its
 *   first paint, or a series filtered down to nothing. Each layout returns a zeroed layout for
 *   those rather than throwing, so a chart can render itself as empty.
 */
/** Throws unless `value` is a finite number of zero or more pixels. */
function requireSize(layoutName, propName, value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("".concat(layoutName, ": ").concat(propName, " must be a finite number of pixels of zero or more, got ").concat(value));
  }
}
/** Throws unless `value` is a finite ratio within `[0, 1]`. */
function requireRatio(layoutName, propName, value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("".concat(layoutName, ": ").concat(propName, " must be a ratio within [0, 1], got ").concat(value));
  }
}
/** Throws unless `value` is a whole number of zero or more items. */
function requireCount(layoutName, propName, value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError("".concat(layoutName, ": ").concat(propName, " must be a whole number of zero or more, got ").concat(value));
  }
}

export { requireCount, requireRatio, requireSize };
//# sourceMappingURL=validate.js.map
