/**
 * d3-request shim
 *
 * This module shims [d3-request](https://github.com/d3/d3-request) from d3v4 using
 * the new [d3-fetch](https://github.com/d3/d3-fetch) from d3v5. This makes it
 * possible to use d3v4 code with d3v5 for the use cases in SSZVIS, but not when
 * using more advanced functionality of d3-request (e.g. setting headers).
 *
 * Example from d3v4 that works thanks to this shim:
 *
 *     d3.csv("http://example.com")
 *       .row(function(x) {
 *         return {
 *           year: parseInt(x.Jahr, 10)
 *         }
 *       })
 *       .get(function(error, data) {
 *         if (error) {
 *           sszvis.loadError(error);
 *           return;
 *         }
 *         actions.prepareState(data);
 *       })
 *
 * With d3v5 this can now be written like:
 *
 *     d3.csv("http://example.com", function(x) { return x })
 *       .then(actions.prepareState)
 *       .catch(sszvis.loadError)
 *
 * Supported d3 versions:
 * - d3 5.0: Fully supported
 * - d3 4.0: Partially supported (only "get" and "row" methods have been implemented)
 */

// -----------------------------------------------------------------------------
