/**
 * This function prepares the data for the stackedPyramid component
 *
 * The input data is expected to have at least four columns:
 *
 *  - side: determines on which side (left/right) the value goes. MUST have cardinality of two!
 *  - row: determines on which row (vertical position) the value goes.
 *  - series: determines in which series (for the stack) the value is.
 *  - value: the numerical value.
 *
 * The combination of each distinct (side,row,series) triplet MUST appear only once
 * in the data. This function makes no effort to normalize the data if that's not the case.
 */
export function stackedPyramidData(sideAcc: any, _rowAcc: any, seriesAcc: any, valueAcc: any): (data: any) => any;
export function stackedPyramid(): any;
//# sourceMappingURL=stackedPyramid.d.ts.map