import { error } from './logger.js';

/**
 * Handle data load errors in a standardized way
 *
 * @module sszvis/loadError
 *
 * @param  {Error} The error object
 */


// var RELOAD_MSG = 'Versuchen Sie, die Webseite neu zu laden. Sollte das Problem weiterhin bestehen, nehmen Sie mit uns Kontakt auf.';

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
