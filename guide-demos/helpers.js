/* global d3, sszvis */
/*
 * Helpers the colors and tooltips guides call from their runnable snippets.
 * Ported from the previous documentation site; the `<Demo>` component loads
 * this file into each snippet's frame.
 */
(function (global) {
  "use strict";

  const BAR_WIDTH = 80;
  const BAR_HEIGHT = 80;

  function renderSwatch(containerId, colors) {
    const container = document.getElementById(containerId);
    for (const c of colors) {
      const colorDiv = document.createElement("div");
      colorDiv.style.height = BAR_HEIGHT + "px";
      colorDiv.style.width = 100 / colors.length + "%";
      colorDiv.style.maxWidth = BAR_WIDTH + "px";
      colorDiv.style.backgroundColor = c;
      colorDiv.innerHTML = "<span>" + c + "</span>";
      container.append(colorDiv);
    }
  }

  global.colorSwatchFromLinearScale = (containerId, scale, numBars) => {
    scale.domain([0, numBars - 1]);
    renderSwatch(containerId, d3.range(0, numBars).map(scale));
  };

  global.colorSwatchFromColors = (containerId, colors) => {
    renderSwatch(containerId, colors.map(String));
  };

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
