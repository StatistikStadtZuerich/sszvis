/**
 * aspectRatio
 *
 * The base module is a function which creates an aspect ratio function.
 * You provide a width and a height of the aspect ratio, and the
 * returned function accepts any width, returning the corresponding
 * height for the aspect ratio you configured.
 *
 * @param {Number} x  The number of parts on the horizontal axis (dividend)
 * @param {Number} y  The number of parts on the vertical axis (divisor)
 * @return {Function} The aspect ratio function. Takes a width as an argument
 *                    and returns the corresponding height based on the
 *                    aspect ratio defined by x:y.
 */
export function aspectRatio(x: number, y: number): Function;
/**
 * aspectRatio4to3
 *
 * Recommended breakpoints:
 *   - palm
 *
 * @param {Number} width
 * @returns {Number} height
 */
export const aspectRatio4to3: Function;
/**
 * aspectRatio16to10
 *
 * Recommended breakpoints:
 *   - lap
 *
 * @param {Number} width
 * @returns {Number} height
 */
export const aspectRatio16to10: Function;
export function aspectRatio12to5(width: any): number;
export namespace aspectRatio12to5 {
    export { AR12TO5_MAX_HEIGHT as MAX_HEIGHT };
}
export function aspectRatioSquare(width: any): number;
export namespace aspectRatioSquare {
    export { SQUARE_MAX_HEIGHT as MAX_HEIGHT };
}
export function aspectRatioPortrait(width: any): number;
export namespace aspectRatioPortrait {
    export { PORTRAIT_MAX_HEIGHT as MAX_HEIGHT };
}
export function aspectRatioAuto(measurement: any): any;
/**
 * aspectRatio12to5
 *
 * Recommended breakpoints:
 *   - desk
 *
 * @param {Number} width
 * @returns {Number} height
 */
declare const AR12TO5_MAX_HEIGHT: 500;
/**
 * aspectRatioSquare
 *
 * This aspect ratio constrains the returned height to a maximum of 420px.
 * It is recommended to center charts within this aspect ratio.
 *
 * Exposes the MAX_HEIGHT used as a property on the function.
 *
 * Recommended breakpoints:
 *   - palm
 *   - lap
 *   - desk
 *
 * @param {Number} width
 * @returns {Number} height
 */
declare const SQUARE_MAX_HEIGHT: 420;
/**
 * aspectRatioPortrait
 *
 * This aspect ratio constrains the returned height to a maximum of 600px.
 * It is recommended to center charts within this aspect ratio.
 *
 * Exposes the MAX_HEIGHT used as a property on the function.
 *
 * Recommended breakpoints:
 *   - palm
 *   - lap
 *   - desk
 *
 * @param {Number} width
 * @returns {Number} height
 */
declare const PORTRAIT_MAX_HEIGHT: 600;
export {};
//# sourceMappingURL=aspectRatio.d.ts.map