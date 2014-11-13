/**
 * Handle data load errors in a standardized way
 *
 * @module sszvis/loadError
 *
 * @param  {Error} The error object
 */
namespace('sszvis.loadError', function(module) {

  var RELOAD_MSG = 'Versuchen Sie, die Webseite neu zu laden. Sollte das Problem weiterhin bestehen, nehmen Sie mit uns Kontakt auf.';

  module.exports = function(error) {
    sszvis.logger.error(error);
    if (error.status === 404) {
      alert('Die Daten konnten nicht geladen werden.\n\n' + error.responseURL + '\n\n' + RELOAD_MSG);
    } else {
      alert('Ein Fehler ist aufgetreten und die Visualisierung kann nicht angezeigt werden. ' + RELOAD_MSG);
    }
  }

});
