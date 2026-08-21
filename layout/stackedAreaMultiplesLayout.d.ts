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
 * - pct defaults via `pct || 0.1`, so an explicit 0 (or NaN) is silently replaced by 0.1.
 * - num === pct divides by zero. With the default pct the step is Infinity and the range comes
 *   back empty; with a pct above 1 the first baseline is -Infinity and the range holds that one
 *   unusable value.
 * - 0.1 < num < 1 also yields an empty range (the first baseline already sits below the chart).
 * - A zero height, or num < pct < 1, makes both the step and the first baseline non-positive, and
 *   the baseline loop then runs forever (WARNING: no guard). A pct above 1 escapes this, because
 *   the negative step is multiplied by a negative (1 - pct) and the loop never starts.
 * - A negative height returns an empty range with a negative, unusable bandHeight.
 */
export type StackedAreaMultiplesLayout = {
    range: number[];
    bandHeight: number;
    padHeight: number;
};
export default function (height: number, num: number, pct?: number): StackedAreaMultiplesLayout;
//# sourceMappingURL=stackedAreaMultiplesLayout.d.ts.map