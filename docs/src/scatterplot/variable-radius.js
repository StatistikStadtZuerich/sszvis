module.exports = function (d3, sszvis, config) {

  /* Configuration
  ----------------------------------------------- */

  var queryProps = sszvis
    .responsiveProps()
    .prop("xAxisLabel", {
      _: "NeubauAbs",
    })
    .prop("yAxisLabel", {
      _: "LeerZunRel",
    })
    .prop("rLabel", {
      _: "Radius",
    })
    .prop("xTicks", {
      _: null,
    })
    .prop("yTicks", {
      _: null,
    })
    .prop("legendTicks", {
      _: null,
    })
    .prop("legendPadding", {
      _: 60,
    });

  /* Shortcuts
  ----------------------------------------------- */
  function parseRow(d) {
    return {
      xPosition: sszvis.parseNumber(d["NeubauAbs (x-Achse)"]),
      yPosition: sszvis.parseNumber(d["LeerZunRel (y-Achse) "]),
      radius: sszvis.parseNumber(d["Best13Radius (bubble)"]),
      label: d["QuName"],
    };
  }

  var xAcc = sszvis.prop("xPosition");
  var yAcc = sszvis.prop("yPosition");
  var rAcc = sszvis.prop("radius");
  var cAcc = sszvis.prop("label");

  /* Application state
  ----------------------------------------------- */
  var state = {
    data: [],
    highlightData: [],
    xExtent: [0, 0],
    yExtent: [0, 0],
    rExtent: [0, 0],
  };

  /* State transitions
  ----------------------------------------------- */
  var actions = {
    prepareState: function (data) {
      state.data = data;

      // for the voronoi component to work, the data must first be filtered such that no two vertices
      // fall at exactly the same point.
      state.voronoiFiltered = sszvis.derivedSet(state.data, function (d) {
        return xAcc(d) + "__" + yAcc(d);
      });

      state.xExtent = d3.extent(state.data, xAcc);
      state.yExtent = d3.extent(state.data, yAcc);
      var radiusExtent = d3.extent(state.data, rAcc);
      state.rExtent = [Math.floor(radiusExtent[0]), Math.ceil(radiusExtent[1])];

      render(state);
    },

    setHighlight: function (d) {
      state.highlightData = [d];
      render(state);
    },

    resetHighlight: function () {
      state.highlightData = [];
      render(state);
    },

    resize: function () {
      render(state);
    },
  };

  /* Data initialization
  ----------------------------------------------- */
  d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);

  /* Render
  ----------------------------------------------- */
  function render(state) {
    var props = queryProps(sszvis.measureDimensions(config.id));
    var bounds = sszvis.bounds({ top: 20, bottom: 110 }, config.id);

    // Scales

    var xScale = d3.scaleLinear().domain(state.xExtent).range([0, bounds.innerWidth]);

    var xValue = sszvis.compose(xScale, xAcc);

    var yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

    var yValue = sszvis.compose(yScale, yAcc);

    var rScale = d3.scaleLinear().domain(state.rExtent).range([1, 20]);

    // Layers

    var chartLayer = sszvis.createSvgLayer(config.id, bounds).datum(state.data);

    var tooltipLayer = sszvis.createHtmlLayer(config.id, bounds).datum(state.highlightData);

    // Components

    var dots = sszvis
      .dot()
      .x(xValue)
      .y(yValue)
      .radius(sszvis.compose(rScale, rAcc))
      .fill(sszvis.scaleQual12())
      // use white outlines in scatterplots to assist in identifying distinct circles
      .stroke("#FFFFFF");

    var xAxis = sszvis
      .axisX()
      .scale(xScale)
      .orient("bottom")
      .contour(true)
      .ticks(props.xTicks)
      .tickFormat(function (d) {
        return d < 1 ? d.toPrecision(1) : d;
      })
      .title(props.xAxisLabel);

    var yAxis = sszvis
      .axisY()
      .scale(yScale)
      .orient("right")
      .showZeroY(true)
      .contour(true)
      .ticks(props.yTicks)
      .title(props.yAxisLabel);

    var radiusLegend = sszvis
      .legendRadius()
      .scale(rScale)
      .tickValues(props.legendTicks)
      .tickFormat(function (d) {
        return Math.round(d * 100) / 100;
      });

    var tooltip = sszvis
      .tooltip()
      .renderInto(tooltipLayer)
      .header(cAcc)
      .body(function (d) {
        return [
          [props.xAxisLabel, sszvis.formatNumber(xAcc(d))],
          [props.yAxisLabel, sszvis.formatNumber(yAcc(d))],
          [props.rLabel, sszvis.formatNumber(rAcc(d))],
        ];
      })
      .visible(function (d) {
        return sszvis.contains(state.highlightData, d);
      })
      .orientation(function (d) {
        return xValue(d.datum) <= bounds.innerWidth / 2 ? "left" : "right";
      });

    // Rendering

    chartLayer.selectGroup("dots").call(dots);

    chartLayer.selectAll("[data-tooltip-anchor]").call(tooltip);

    chartLayer
      .selectGroup("radiusLegend")
      .attr("transform", sszvis.translateString(1, bounds.innerHeight + props.legendPadding))
      .call(radiusLegend);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer
      .selectGroup("yAxis")
      .call(yAxis)
      .call(removeOverlappingYTickLabels(bounds.innerHeight));

    sszvis.viewport.on("resize", actions.resize);

    // Interaction
    var mouseOverlay = sszvis
      .voronoi()
      .x(xValue)
      .y(yValue)
      .bounds([
        [0, 0],
        [bounds.innerWidth, bounds.innerHeight],
      ])
      .on("over", actions.setHighlight)
      .on("out", actions.resetHighlight);

    chartLayer.selectGroup("voronoiMouse").datum(state.voronoiFiltered).call(mouseOverlay);
  }

  /* Helper functions
  ----------------------------------------------- */

  function removeOverlappingYTickLabels(maxBottom) {
    return function (g) {
      g.selectAll("text").each(function () {
        var bottom = this.getBoundingClientRect().bottom;
        if (bottom >= maxBottom) d3.select(this.parentNode).style("display", "none");
      });
    };
  }
}