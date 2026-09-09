/* global sszvis */
(function (global) {
  "use strict";

  global.getTooltipComponent = (containerId, data) => {
    const tooltipLayer = sszvis.createHtmlLayer("#" + containerId).datum(data);

    return sszvis.tooltip().renderInto(tooltipLayer).visible(true);
  };

  global.renderTooltip = (containerId, size, data, position, tooltip, debug) => {
    const container = sszvis.createSvgLayer("#" + containerId, sszvis.bounds(size), {}).datum(data);

    const tooltipAnchor = sszvis.tooltipAnchor().debug(!!debug).position(sszvis.functor(position));

    container.call(tooltipAnchor);

    container.selectAll("[data-tooltip-anchor]").call(tooltip);

    return container;
  };
})(this);
