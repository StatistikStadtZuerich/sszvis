/**
 * @module sszvis/svgUtils/toFinite
 *
 * Coerces a geometry value to a finite number, substituting 0 for anything else.
 *
 * Coercion first, so a numeric string still works; the finiteness check then catches NaN
 * and Infinity as well as the values that do not coerce at all.
 *
 * Shared by the mark components - bar, dot and groupedBars - which are expected to agree on
 * what an unusable geometry value means. It is deliberately not re-exported from
 * svgUtils/index.js: that barrel is public API, and this is an internal guard.
 */
function toFinite(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export { toFinite };
//# sourceMappingURL=toFinite.js.map
