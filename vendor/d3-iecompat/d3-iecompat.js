(function(d3) {
  'use strict';

  /**
   * Internet Explorer 9 does not work with instanceof checks on
   * d3 selections, i.e. `d3.select(body) instanceof d3.selection`.
   * We need this functionality in order to wrap plain DOM nodes
   * into d3.selections in some cases.
   *
   * What this solution does is add a global property to all
   * selection's prototypes that can also be checked in IE9.
   *
   * @see http://stackoverflow.com/a/33236441/84816
   */
  d3.selection.prototype.isD3Selection = true;

}(d3));
