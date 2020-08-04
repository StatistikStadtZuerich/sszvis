(function (global) {
  "use strict";

  var BAR_WIDTH = 80;
  var BAR_HEIGHT = 80;

  global.colorSwatchFromLinearScale = function (containerId, scale, numBars) {
    scale.domain([0, numBars - 1]);
    renderSwatch(containerId, d3.range(0, numBars).map(scale));
  };

  global.colorSwatchFromColors = function (containerId, colors) {
    renderSwatch(containerId, colors.map(String));
  };

  /* Utils
  ----------------------------------------------- */
  function renderSwatch(containerId, colors) {
    var container = document.getElementById(containerId);

    colors.forEach(function (c) {
      var colorDiv = document.createElement("div");
      colorDiv.style.height = px(BAR_HEIGHT);
      colorDiv.style.width = pct(100 / colors.length);
      colorDiv.style.maxWidth = px(BAR_WIDTH);
      colorDiv.style.backgroundColor = c;
      colorDiv.innerHTML = "<span>" + c + "</span>";
      container.appendChild(colorDiv);
    });
  }

  function px(n) {
    return n + "px";
  }
  function pct(n) {
    return n + "%";
  }
})(this);
