import { error } from './logger.js';

/**
 * Handle data load errors in a standardized way
 *
 * @module sszvis/loadError
 */
/**
 * Handle data loading errors by logging them
 * @param error The error object from a failed data load operation
 */
const loadError = error$1 => {
  error(error$1);
  // Don't use alert()!
  // TODO: render an inline error in the chart instead
  // if (error.status === 404) {
  //   alert('Die Daten konnten nicht geladen werden.\n\n' + error.responseURL + '\n\n' + RELOAD_MSG);
  // } else {
  //   alert('Ein Fehler ist aufgetreten und die Visualisierung kann nicht angezeigt werden. ' + RELOAD_MSG);
  // }
};

export { loadError };
//# sourceMappingURL=loadError.js.map
