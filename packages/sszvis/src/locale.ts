import type { FormatLocaleDefinition, TimeLocaleDefinition } from "d3";

/**
 * Swiss German format locale definition for d3.format functions
 */
export const formatLocale: FormatLocaleDefinition = {
  decimal: ".",
  thousands: " ", // This is a 'narrow space', not a regular space. Used as the thousands separator by d3.format
  grouping: [3],
  currency: ["CHF ", ""],
};

/**
 * Swiss German time locale definition for d3.time functions
 */
export const timeLocale: TimeLocaleDefinition = {
  dateTime: "%a. %e. %B %X %Y",
  date: "%d.%m.%Y",
  time: "%H:%M:%S",
  periods: ["", ""], // Fixed: D3 expects a tuple of 2 strings for AM/PM
  days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  months: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  shortMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
};
