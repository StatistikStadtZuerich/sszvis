/**
 * Parsing functions
 *
 * @module sszvis/parse
 */

import { timeFormatLocale } from "d3";
import { timeLocale } from "./locale.js";

const timeParse = timeFormatLocale(timeLocale).parse;

/**
 * Parse Swiss date strings, e.g. "17.08.2014".
 *
 * Accepts `undefined` and `null`, because a d3 row callback types every CSV
 * cell as `string | undefined` and a missing cell is normal input. Returns
 * `null` for a missing or unparseable value.
 */
const dateParser = timeParse("%d.%m.%Y");
export const parseDate = (d: string | undefined | null): Date | null =>
  d == null ? null : dateParser(d);

/**
 * Parse a year value like "2014" into a date at the first instant of that year.
 *
 * Accepts `undefined` and `null` for the same reason as `parseDate`, and
 * returns `null` for a missing or unparseable value.
 */
const yearParser = timeParse("%Y");
export const parseYear = (d: string | undefined | null): Date | null =>
  d == null ? null : yearParser(d);

/**
 * Parse untyped input as a number.
 *
 * Accepts `undefined` and `null`, because a d3 row callback types every CSV
 * cell as `string | undefined` and a missing cell is normal input. Returns
 * `NaN` for a missing, empty, or non-numeric value.
 */
export const parseNumber = (d: string | undefined | null): number =>
  d == null || d.trim() === "" ? Number.NaN : +d;
