/* global d3 sszvis */
(function (d3, sszvis) {
  "use strict";

  /* Configuration
    ----------------------------------------------- */
  const config = {
    percentage: true,
    yExtentOverride: [0, 101],
    xColumn: "Jahr",
    categoryColumn: "Bildungsstand",
    yTicks: 5,
    yAxisLabel: "",
    yColumn: "Anteil",
    lowerColumn: "unten",
    upperColumn: "oben",
    xAxisLabel: "",
    xTicks: 5,
    targetElement: "#sszvis-chart",
  };

  const queryProps = sszvis
    .responsiveProps()
    .breakpoints([
      { name: "small", width: 280 },
      { name: "narrow", width: 516 },
    ])
    .prop("bottomPadding", {
      small: 130,
      narrow: 100,
      _: 100,
    })
    .prop("xTicks", {
      narrow: 5,
      _: config.xTicks,
    });

  /* Shortcuts
    ----------------------------------------------- */
  const xAcc = sszvis.prop("date");
  const cAcc = sszvis.prop("category");
  const yAcc = sszvis.prop("value");
  const lAcc = sszvis.prop("lower");
  const uAcc = sszvis.prop("upper");

  /* Application state
    ----------------------------------------------- */
  const state = {
    data: [],
    lineData: [],
    dates: [],
    selection: [],
    yExtent: [0, 0],
    categories: [],
    confSelection: [],
  };

  /* State transitions
    ----------------------------------------------- */
  const actions = {
    prepareState(data) {
      state.data = data;
      state.lineData = sszvis.cascade().arrayBy(cAcc, d3.ascending).apply(state.data);
      state.dates = d3.extent(state.data, xAcc);
      state.yExtent = d3.extent(state.data, yAcc);

      // trying to prevent an error where the line dissapears
      state.yExtent[0] -= 0.001;

      state.categories = sszvis.set(state.data, cAcc);

      actions.resetDate();
    },
    changeDate(e, inputDate, yVal) {
      // Find the date of the datum closest to the input date
      const datum = closestDatum(state.data, xAcc, inputDate);

      const closestDate = xAcc(datum);
      // Find all data that have the same date as the closest datum

      const closestData = state.lineData.map((linePoints) =>
        // For each line pick the first datum that matches
        sszvis.find((d) => xAcc(d).toString() === closestDate.toString(), linePoints)
      );

      let closestToMouse = null;
      let minDist = Number.MAX_VALUE;

      if (yVal) {
        for (const d of closestData) {
          if (closestToMouse) {
            const dist = Math.abs(yAcc(d) - yVal);
            if (dist < minDist) {
              minDist = dist;
              closestToMouse = d;
            }
          } else {
            minDist = Math.abs(yAcc(d) - yVal);
            closestToMouse = d;
          }
        }
      }

      // Make sure that the selection has a value to display
      state.selection = closestData.filter(sszvis.compose(sszvis.not(isNaN), yAcc));

      // for confidence
      state.confSelection = yVal ? state.data.filter((d) => cAcc(d) === cAcc(closestToMouse)) : [];

      render(state);
    },

    resetDate() {
      state.selection = [];
      render(state);
    },

    resize() {
      render(state);
    },
  };

  /* Data initialization
    ----------------------------------------------- */
  d3.csv("data/confidence.csv", (d) => ({
    date: sszvis.parseYear(d[config.xColumn]),
    value: sszvis.parseNumber(d[config.yColumn]),
    category: d[config.categoryColumn],
    lower: sszvis.parseNumber(d[config.lowerColumn]),
    upper: sszvis.parseNumber(d[config.upperColumn]),
  }))
    .then(actions.prepareState)
    .catch(sszvis.loadError);

  /* Render
    ----------------------------------------------- */
  function render(state) {
    const props = queryProps(sszvis.measureDimensions(config.targetElement));
    const bounds = sszvis.bounds(
      {
        top: 60,
        bottom: props.bottomPadding,
      },
      config.targetElement
    );
    // Scales
    const xScale = d3.scaleTime().domain(state.dates).range([0, bounds.innerWidth]);

    const yScale = d3.scaleLinear().domain(state.yExtent).range([bounds.innerHeight, 0]);

    const cScale = sszvis.scaleQual6().domain(state.categories);

    // Layers
    const chartLayer = sszvis.createSvgLayer(config.targetElement, bounds, {
      title: "",
      description: "",
    });

    // Components
    const line = sszvis
      .line()
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      .stroke(sszvis.compose(cScale, cAcc, sszvis.first));

    // for confindence interval
    const area = sszvis
      .annotationConfidenceArea()
      .x(sszvis.compose(xScale, xAcc))
      .y0(sszvis.compose(yScale, lAcc))
      .y1(sszvis.compose(yScale, uAcc))
      .stroke("none")
      .fill("#EAEAEA")
      .transition(false);

    const xTickValues = [...xScale.ticks(props.xTicks), ...state.selection.map(xAcc)];

    const xAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues(xTickValues)
      .alignOuterLabels(true)
      .highlightTick(isSelected)
      .title(config.xAxisLabel);

    const yTickValues = config.yTicks ? yScale.ticks(config.yTicks) : yScale.ticks();
    const showZero = d3.min(yTickValues) !== 0;

    const yAxis = sszvis
      .axisY()
      .tickValues(yTickValues)
      .showZeroY(showZero)
      .tickFormat((d) => {
        if (d === 0 && !yAxis.showZeroY()) {
          return null;
        }
        return config.percentage ? sszvis.formatPercent(d) : sszvis.formatNumber(d);
      })
      .scale(yScale)
      .orient("right")
      .contour(true)
      .title(config.yAxisLabel)
      .dyTitle(-20);

    const rulerLabel = sszvis
      .modularTextSVG()
      .bold((d) =>
        config.percentage
          ? sszvis.formatPreciseNumber(1, yAcc(d)) + " %"
          : sszvis.formatPreciseNumber(1, yAcc(d))
      )
      .plain((d) => cAcc(d));

    const highlightLayer = sszvis
      .annotationRuler()
      .top(0)
      .bottom(bounds.innerHeight)
      .x(sszvis.compose(xScale, xAcc))
      .y(sszvis.compose(yScale, yAcc))
      .label(rulerLabel)
      .flip((d) => xScale(xAcc(d)) >= bounds.innerWidth / 2)
      .color(sszvis.compose(cScale, cAcc))
      .labelId(cAcc)
      .reduceOverlap(true);

    const cLegend = sszvis
      .legendColorOrdinal()
      .scale(cScale)
      .horizontalFloat(true)
      .floatWidth(bounds.innerWidth);

    // Rendering

    chartLayer.selectGroup("area").datum([state.confSelection]).call(area);

    chartLayer.selectGroup("line").datum(state.lineData).call(line);

    chartLayer
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, bounds.innerHeight))
      .call(xAxis);

    chartLayer.selectGroup("yAxis").call(yAxis);

    chartLayer
      .selectGroup("cScale")
      .attr("transform", sszvis.translateString(1, bounds.innerHeight + 40))
      .call(cLegend);

    chartLayer.selectGroup("highlight").datum(state.selection).call(highlightLayer);

    // Interaction

    const interactionLayer = sszvis
      .move()
      .xScale(xScale)
      .yScale(yScale)
      .on("move", actions.changeDate)
      .on("end", actions.resetDate);

    chartLayer.selectGroup("interaction").call(interactionLayer);

    sszvis.viewport.on("resize", actions.resize);
  }

  /* Helper functions
    ----------------------------------------------- */

  function closestDatum(data, accessor, datum) {
    const i = d3.bisector(accessor).left(data, datum, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;
    return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
  }

  function isSelected(d) {
    return sszvis.contains(state.selection.map(xAcc).map(String), String(d));
  }
})(d3, sszvis);
