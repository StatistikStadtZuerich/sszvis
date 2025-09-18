/**
 * Fallback handling
 *
 * Defaults to rendering a fallback image with standard chart proportions.
 *
 * @example
 * if (sszvis.fallback.unsupported()) {
 *   sszvis.fallback.render('#sszvis-chart', {src: '../fallback.png', height: 300});
 *   return;
 * }
 *
 * @module sszvis/fallback
 */
import { SelectableElement } from "./types";
export interface FallbackOptions {
    src?: string;
    height?: number;
}
export declare const fallbackUnsupported: () => boolean;
export declare const fallbackCanvasUnsupported: () => boolean;
export declare const fallbackRender: (selector: SelectableElement, options?: FallbackOptions) => void;
//# sourceMappingURL=fallback.d.ts.map