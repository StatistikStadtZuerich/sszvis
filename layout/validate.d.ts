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
export declare function requireSize(layoutName: string, propName: string, value: number): void;
/** Throws unless `value` is a finite ratio within `[0, 1]`. */
export declare function requireRatio(layoutName: string, propName: string, value: number): void;
/** Throws unless `value` is a whole number of zero or more items. */
export declare function requireCount(layoutName: string, propName: string, value: number): void;
//# sourceMappingURL=validate.d.ts.map