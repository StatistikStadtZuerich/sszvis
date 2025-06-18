/**
 * Formatting functions
 *
 * @module sszvis/format
 */

import { formatLocale, timeFormatLocale, FormatLocaleDefinition, TimeLocaleDefinition } from "d3";
import * as fn from "./fn";
import { locale } from "./locale";
const timeFormat = timeFormatLocale(locale as unknown as TimeLocaleDefinition).format;
const format = formatLocale(locale as unknown as FormatLocaleDefinition).format;

/**
 * Format a number as an age
 */
export const formatAge = function (d: number): string {
  return String(Math.round(d));
};

/**
 * A multi time formatter used by the axis class
 */
export const formatAxisTimeFormat = function (d: Date): string {
  const xs: [string, (date: Date) => boolean | number][] = [
    [
      ".%L",
      function (date: Date): number {
        return date.getMilliseconds();
      },
    ],
    [
      ":%S",
      function (date: Date): number {
        return date.getSeconds();
      },
    ],
    [
      "%H:%M",
      function (date: Date): number {
        return date.getMinutes();
      },
    ],
    [
      "%H Uhr",
      function (date: Date): number {
        return date.getHours();
      },
    ],
    [
      "%a., %d.",
      function (date: Date): boolean {
        return Boolean(date.getDay() && date.getDate() != 1);
      },
    ],
    [
      "%e. %b",
      function (date: Date): boolean {
        return date.getDate() != 1;
      },
    ],
    [
      "%B",
      function (date: Date): number {
        return date.getMonth();
      },
    ],
    [
      "%Y",
      function (): boolean {
        return true;
      },
    ],
  ];

  for (const x of xs) {
    if (x[1](d)) {
      return timeFormat(x[0])(d);
    }
  }

  // Fallback - should never happen, but TypeScript requires a return
  return timeFormat("%Y")(d);
};

/**
 * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
 */
export const formatMonth = fn.compose((m: string) => m.toUpperCase(), timeFormat("%b"));

/**
 * A year formatter for date objects. Gives the date's year.
 */
export const formatYear = timeFormat("%Y");

/**
 * Formatter for no label
 */
export const formatNone = function (): string {
  return "";
};

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
export const formatNumber = function (d: number | null | undefined): string {
  let p: number;
  const dAbs = Math.abs(d ?? 0);

  if (d == null || isNaN(d)) {
    return "–"; // This is an en-dash
  }

  // 10250    -> "10 250"
  // 10250.91 -> "10 251"
  else if (dAbs >= 1e4) {
    // Includes ',' for thousands separator. The default use of the 'narrow space' as a separator
    // is configured in the localization file at vendor/d3-de/d3-de.js (also included with sszvis)
    return format(",.0f")(d);
  }

  // 2350     -> "2350"
  // 2350.29  -> "2350.3"
  else if (dAbs >= 100) {
    p = Math.min(1, decimalPlaces(d));
    // Where there are decimals, round to 1 position
    // To display more precision, use the preciseNumber function.
    return stripTrailingZeroes(format("." + p + "f")(d));
  }

  // 41       -> "41"
  // 41.1     -> "41.1"
  // 41.329   -> "41.33"
  else if (dAbs > 0) {
    p = Math.min(2, decimalPlaces(d));
    // Rounds to (the minimum of decLen or 2) digits. This means that 1 digit or 2 digits are possible,
    // but not more. To display more precision, use the preciseNumber function.
    return stripTrailingZeroes(format("." + p + "f")(d));
  }

  // If abs(num) is not > 0, num is 0
  // 0       -> "0"
  else {
    return format(".0f")(0);
  }
};

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
export function formatPreciseNumber(p: number): (x: number) => string;
export function formatPreciseNumber(p: number, d: number): string;
export function formatPreciseNumber(p: number, d?: number): string | ((x: number) => string) {
  // This curries the function
  if (arguments.length > 1 && d !== undefined) return formatPreciseNumber(p)(d);

  return function (x: number): string {
    const dAbs = Math.abs(x);
    return dAbs >= 100 && dAbs < 1e4 ? format("." + p + "f")(x) : format(",." + p + "f")(x);
  };
}

/**
 * Format percentages on the range 0 - 100
 */
export const formatPercent = function (d: number): string {
  // Uses unix thin space
  return formatNumber(d) + " %";
};

/**
 * Format percentages on the range 0 - 1
 */
export const formatFractionPercent = function (d: number): string {
  // Uses unix thin space
  return formatNumber(d * 100) + " %";
};

/**
 * Default formatter for text
 */
export const formatText = String;

/* Helper functions
----------------------------------------------- */

// decLen is the number of decimal places in the number
// 0.0002 -> 4
// 0.0000 -> 0 (Javascript's number implementation chops off trailing zeroes)
// 123456.1 -> 1
// 123456.00001 -> 5
function decimalPlaces(num: number): number {
  return (String(Math.abs(num)).split(".")[1] || "").length;
}

function stripTrailingZeroes(str: string): string {
  return str.replace(/(\.\d*[1-9])0+$|\.0*$/, "$1");
}
