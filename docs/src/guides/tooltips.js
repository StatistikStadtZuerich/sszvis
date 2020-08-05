(function (global) {
  "use strict";

  global.getTooltipComponent = function (containerId, data) {
    var tooltipLayer = sszvis.createHtmlLayer("#" + containerId).datum(data);

    return sszvis.tooltip().renderInto(tooltipLayer).visible(true);
  };

  global.renderTooltip = function (containerId, size, data, position, tooltip, debug) {
    var container = sszvis.createSvgLayer("#" + containerId, sszvis.bounds(size), {}).datum(data);

    var tooltipAnchor = sszvis.tooltipAnchor().debug(!!debug).position(sszvis.functor(position));

    container.call(tooltipAnchor);

    container.selectAll("[data-tooltip-anchor]").call(tooltip);

    return container;
  };
})(this);
