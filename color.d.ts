/**
 * Color scales
 *
 * Three kinds of color scales are provided: qualitative, sequential, and
 * diverging. All color scales can be reversed, qualitative color scales
 * can also be brightened or darkened.
 *
 * @module sszvis/color
 *
 *
 * Qualitative color scales
 *
 * @function qual12    The full range of categorical colors
 * @function qual6     Subset of saturated categorical colors
 * @function qual6a    Subset of blue-green categorical colors
 * @function qual6b    Subset of yellow-red categorical colors
 * @method   darken    Instance method to darken all colors. @returns new scale
 * @method   brighten  Instance method to brighten all colors. @returns new scale
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 *
 * Sequential color scales
 *
 * @function seqBlu    Linear color scale from bright to dark blue
 * @function seqRed    Linear color scale from bright to dark red
 * @function seqGrn    Linear color scale from bright to dark green
 * @function seqBrn    Linear color scale from bright to dark brown
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 *
 * Diverging color scales
 *
 * @function divVal    Diverging and valued color scale from red to blue
 * @function divNtr    Diverging and neutral color scale from brown to green
 * @function divValGry constiation of the valued scale with a grey midpoint
 * @function divNtrGry constiation of the neutral scale with a grey midpoint
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 * Grey color scales
 * @function gry       1-color scale for shaded values
 * @function lightGry  1-color scale for shaded backgrounds
 */
import { type HSLColor, type LabColor, type ScaleLinear, type ScaleOrdinal } from "d3";
/**
 * Extended ordinal scale with additional methods for color manipulation
 */
export interface ExtendedOrdinalScale extends ScaleOrdinal<string, LabColor> {
    /**
     * Create a darker version of the scale
     */
    darker(): ExtendedOrdinalScale;
    /**
     * Create a brighter version of the scale
     */
    brighter(): ExtendedOrdinalScale;
    /**
     * Reverse the color order
     */
    reverse(): ExtendedOrdinalScale;
}
/**
 * Extended linear scale with additional methods for color manipulation
 */
export interface ExtendedLinearScale extends ScaleLinear<LabColor, LabColor> {
    /**
     * Reverse the color order
     */
    reverse(): ExtendedLinearScale;
}
/**
 * Extended diverging scale with additional methods for color manipulation
 */
export interface ExtendedDivergingScale extends ScaleLinear<LabColor, LabColor> {
    /**
     * Reverse the color order
     */
    reverse(): ExtendedDivergingScale;
}
/**
 * Color scale factory function type
 */
export type ColorScaleFactory<T> = () => T;
export declare const scaleQual12: ColorScaleFactory<ExtendedOrdinalScale>;
export declare const scaleQual6: ColorScaleFactory<ExtendedOrdinalScale>;
export declare const scaleQual6a: ColorScaleFactory<ExtendedOrdinalScale>;
export declare const scaleQual6b: ColorScaleFactory<ExtendedOrdinalScale>;
export declare const scaleGender3: () => ExtendedOrdinalScale;
export declare const scaleGender6Origin: () => ExtendedOrdinalScale;
export declare const scaleGender5Wedding: () => ExtendedOrdinalScale;
export declare const scaleSeqBlu: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleSeqRed: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleSeqGrn: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleSeqBrn: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleDivVal: ColorScaleFactory<ExtendedDivergingScale>;
export declare const scaleDivValGry: ColorScaleFactory<ExtendedDivergingScale>;
export declare const scaleDivNtr: ColorScaleFactory<ExtendedDivergingScale>;
export declare const scaleDivNtrGry: ColorScaleFactory<ExtendedDivergingScale>;
export declare const scaleLightGry: ColorScaleFactory<ExtendedLinearScale>;
export declare const scalePaleGry: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleGry: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleDimGry: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleMedGry: ColorScaleFactory<ExtendedLinearScale>;
export declare const scaleDeepGry: ColorScaleFactory<ExtendedLinearScale>;
export declare const slightlyDarker: (c: string) => HSLColor;
export declare const muchDarker: (c: string) => HSLColor;
export declare const withAlpha: (c: string, a: number) => string;
//# sourceMappingURL=color.d.ts.map