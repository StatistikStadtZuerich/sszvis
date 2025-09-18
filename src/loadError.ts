/**
 * Handle data load errors in a standardized way
 *
 * @module sszvis/loadError
 */

import * as logger from "./logger";

/**
 * Handle data loading errors by logging them
 * @param error The error object from a failed data load operation
 */
export const loadError = (error: Error | unknown): void => {
  logger.error(error);

  // Don't use alert()!

  // TODO: render an inline error in the chart instead

  // if (error.status === 404) {
  //   alert('Die Daten konnten nicht geladen werden.\n\n' + error.responseURL + '\n\n' + RELOAD_MSG);
  // } else {
  //   alert('Ein Fehler ist aufgetreten und die Visualisierung kann nicht angezeigt werden. ' + RELOAD_MSG);
  // }
};
