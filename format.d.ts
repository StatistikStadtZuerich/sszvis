/**
 * Formatting functions
 *
 * @module sszvis/format
 */
/**
 * Format a number as an age
 */
export declare const formatAge: (d: number) => string;
/**
 * A multi time formatter used by the axis class
 */
export declare const formatAxisTimeFormat: (d: Date) => string;
/**
 * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
 */
export declare const formatMonth: (...args: any[]) => any;
/**
 * A year formatter for date objects. Gives the date's year.
 */
export declare const formatYear: (date: Date) => string;
/**
 * Formatter for no label
 */
export declare const formatNone: () => string;
/**
 * Format numbers according to the sszvis style guide. The most important
 * rules are:
 *
 * - Thousands separator is a thin space (not a space)
 * - Only apply thousands separator for numbers >= 10000
 * - Decimal places only for significant decimals
 * - No decimal places for numbers >= 10000
 * - One decimal place for numbers >= 100
 * - Up to 2 significant decimal places for smaller numbers
 *
 * See also: many test cases for this function in format.test.js
 */
export declare const formatNumber: (d: number | null | undefined) => string;
/**
 * Format numbers to a particular precision. This function is "curried", meaning that it is a function with
 * multiple arguments, but when you call it with less than the full number of arguments, it returns a function
 * that takes less arguments and has the arguments you did provide "pre-filled" as parameters. So that means that:
 *
 * preciseNumber(2, 14.1234) -> "14.12"
 * preciseNumber(2) -> function that accepts numbers and returns formatted values
 *
 * Note that preciseNumber(2, 14.1234) is equivalent to preciseNumber(2)(14.1234)
 */
export declare function formatPreciseNumber(p: number): (x: number) => string;
export declare function formatPreciseNumber(p: number, d: number): string;
/**
 * Format percentages on the range 0 - 100
 */
export declare const formatPercent: (d: number) => string;
/**
 * Format percentages on the range 0 - 1
 */
export declare const formatFractionPercent: (d: number) => string;
/**
 * Default formatter for text
 */
export declare const formatText: StringConstructor;
//# sourceMappingURL=format.d.ts.map