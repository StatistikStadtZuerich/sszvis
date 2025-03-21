/* global d3 */
(function (global) {
  "use strict";

  const BAR_WIDTH = 80;
  const BAR_HEIGHT = 80;

  global.colorSwatchFromLinearScale = (containerId, scale, numBars) => {
    scale.domain([0, numBars - 1]);
    renderSwatch(containerId, d3.range(0, numBars).map(scale));
  };

  global.colorSwatchFromColors = (containerId, colors) => {
    renderSwatch(containerId, colors.map(String));
  };

  // Utils
  // -----------------------------------------------
  function renderSwatch(containerId, colors) {
    const container = document.getElementById(containerId);

    for (const c of colors) {
      const colorDiv = document.createElement("div");
      colorDiv.style.height = px(BAR_HEIGHT);
      colorDiv.style.width = pct(100 / colors.length);
      colorDiv.style.maxWidth = px(BAR_WIDTH);
      colorDiv.style.backgroundColor = c;
      colorDiv.innerHTML = "<span>" + c + "</span>";
      container.append(colorDiv);
    }
  }

  function px(n) {
    return n + "px";
  }
  function pct(n) {
    return n + "%";
  }
})(this);
