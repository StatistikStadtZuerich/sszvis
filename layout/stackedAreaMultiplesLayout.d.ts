/**
 * Stacked Area Multiples Layout
 *
 * This function is used to compute layout parameters for the area multiples chart.
 *
 * @module sszvis/layout/stackedAreaMultiplesLayout
 *
 * @param  {number} height      The available height of the chart
 * @param  {number} num         The number of individual stacks to display
 * @param  {number} pct         the planned-for ratio between the space allotted to each area and the amount of space + area.
 *                              This value is used to compute the baseline positions for the areas, and how much vertical space to leave
 *                              between the areas.
 *
 * @return {object}             An object containing configuration properties for use in laying out the stacked area multiples.
 *                              {
 *                                range:          This is an array of baseline positions, counting from the top of the stack downwards.
 *                                                It should be used to configure a d3.scaleOrdinal(). The values passed into the ordinal
 *                                                scale will be given a y-value which descends from the top of the stack, so that the resulting
 *                                                scale will match the organization scheme of sszvis.stackedArea. Use the ordinal scale to
 *                                                configure the sszvis.stackedAreaMultiples component.
 *                                bandHeight:     The height of each multiples band. This can be used to configure the within-area y-scale.
 *                                                This height represents the height of the y-axis of the individual area multiple.
 *                                padHeight:      This is the amount of vertical padding between each area multiple.
 *                              }
 *
 * Behaviour notes:
 * - step = height / (num - pct); band and pad split that step in a (1 - pct) / pct ratio.
 * - By construction, step * (num - pct) === height, so baseline number `num` always lands exactly on `height`.
 * - The baseline loop terminates on an absolute 1px slack (`level - height < 1`), not a fraction of the step,
 *   so charts whose step is under ~1px get MORE baselines than there are stacks.
 * - pct defaults to 0.1 when it is omitted. An explicit 0 means exactly that: gapless
 *   multiples. A pct outside [0, 1] throws.
 * - num is a count of stacks: a negative or fractional value throws, which also rules out the
 *   num === pct division by zero.
 * - A step that is not strictly positive - a zero or negative height, or a num at or below pct -
 *   describes no band at all, and the layout comes back empty rather than looping forever.
 */
export type StackedAreaMultiplesLayout = {
    range: number[];
    bandHeight: number;
    padHeight: number;
};
export default function layoutStackedAreaMultiples(height: number, num: number, pct?: number): StackedAreaMultiplesLayout;
//# sourceMappingURL=stackedAreaMultiplesLayout.d.ts.map