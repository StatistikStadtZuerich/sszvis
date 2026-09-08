/**
 * @module sszvis/svgUtils
 *
 * This barrel is re-exported from src/index.ts, so everything listed here is public API.
 * toFinite.js is deliberately absent: it is an internal geometry guard shared by the mark
 * components, which import it directly. Adding it here would widen the public surface.
 */
export { halfPixel, roundTransformString, transformTranslateSubpixelShift } from "./crisp.js";
export { default as ensureDefsElement } from "./ensureDefsElement.js";
export { modularTextHTML, modularTextSVG } from "./modularText.js";
export { default as textWrap } from "./textWrap.js";
export { default as translateString } from "./translateString.js";
//# sourceMappingURL=index.d.ts.map