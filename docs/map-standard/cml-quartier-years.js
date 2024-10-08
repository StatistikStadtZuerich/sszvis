/* global d3, topojson, sszvis */

// Configuration
// -----------------------------------------------

// Only select an entity if the distance to an input value is lower than
// this threshold.
const VALUE_PROXIMITY_THRESHOLD = 800;
const queryProps = sszvis
  .responsiveProps()
  .prop("mapInnerHeight", {
    _: sszvis.aspectRatioSquare,
  })
  .prop("mapBottomPadding", {
    palm: 60,
    _: 90,
  })
  .prop("lineChartInnerHeight", {
    palm: 80,
    _: 100,
  })
  .prop("lineChartPadding", {
    palm: 12,
    lap: (w) => w / 10,
    _: (w) => w / 5,
  });

function parseRow(d) {
  return {
    geoId: sszvis.parseNumber(d["QNr"]),
    year: sszvis.parseYear(d["Jahr"]),
    value: sszvis.parseNumber(d["Anzahl"]),
    name: d["Qname"],
  };
}

const vAcc = sszvis.prop("value");
const yearAcc = sszvis.prop("year");
const geoIdAcc = sszvis.prop("geoId");
const nameAcc = sszvis.prop("name");
const mDatumAcc = sszvis.prop("datum");

// Application state
// -----------------------------------------------
const state = {
  data: null,
  mapData: null,
  valueDomain: [0, 0],
  yearDomain: [new Date(), new Date()],
  lineData: [],
  currentYear: new Date(),
  currentMapData: [],
  highlightEntity: null,
  lineBaseColor: sszvis.scaleGry()(0),
  lineHighlightColor: sszvis.scaleQual12()(0),
  mapHighlightData: [],
  lineHighlightData: [],
};

// State transitions
// -----------------------------------------------
const actions = {
  prepareState(data) {
    state.data = data;
    state.valueDomain = [0, d3.max(state.data, vAcc)];
    state.yearDomain = d3.extent(state.data, yearAcc);

    // set up a cascade for sorting data into arrays based on which geoId they belong to
    const cascadedData = sszvis
      .cascade()
      .arrayBy(geoIdAcc)
      .sort((a, b) => d3.ascending(yearAcc(a), yearAcc(b)))
      .apply(state.data);

    // transform the data into line objects, one for each line
    state.lineData = cascadedData.map((lineData) => ({
      geoId: geoIdAcc(sszvis.first(lineData)),
      values: lineData,
    }));

    // calculate a line which represents the average values in the dataset
    const averageLineValues = cascadedData.reduce((m, lineData) => {
      for (const [index, datum] of lineData.entries()) {
        if (!m[index]) {
          m[index] = {
            // isAverageValue is used by the handleRuler component to determine the correct tooltip
            isAverageValue: true,
            year: datum.year,
            value: 0,
          };
        }
        m[index].value += Math.round(datum.value / cascadedData.length);
      }
      return m;
    }, []);
    state.averageLine = {
      // the average line can be identified because it has a null geoId
      geoId: null,
      values: averageLineValues,
    };
    // add the average line to the lineData
    state.lineData.push(state.averageLine);

    actions.resetYear();
  },

  prepareMapData(topo) {
    state.mapData = {
      features: topojson.feature(topo, topo.objects.statistische_quartiere),
      borders: topojson.mesh(topo, topo.objects.statistische_quartiere),
      lakeFeatures: topojson.feature(topo, topo.objects.lakezurich),
      lakeBorders: topojson.mesh(topo, topo.objects.statistische_quartiere_lakebounds),
    };
    render(state);
  },

  changeEntityNearDate(inputValue, inputDate) {
    // find the closest year to the mouse
    const closestYear = yearAcc(closestDatum(state.data, yearAcc, inputDate));

    // within the closest year's data values, find the one closest to the mouse position
    const entitiesForYear = state.data
      .filter((d) => sszvis.stringEqual(closestYear, yearAcc(d)))
      // entries have to be sorted so that d3.bisector will work on it.
      .sort(sortWithAcc(vAcc));

    // Find the closest entity to the mouse
    const closestEntity =
      inputValue === null ? null : closestDatum(entitiesForYear, vAcc, inputValue);

    // Only re-render when the entity has changed
    // Only highlight the entity if it is close enough to the inputValue
    if (
      state.highlightEntity !== closestEntity &&
      Math.abs(inputValue - vAcc(closestEntity)) < VALUE_PROXIMITY_THRESHOLD
    ) {
      // select the entity's sibling from the currently selected year instead
      // of from what's near the mouse in order to highlight the correct
      // entity on the ruler
      state.highlightEntity = sszvis.find(
        (d) => geoIdAcc(d) === geoIdAcc(closestEntity),
        state.currentMapData
      );

      actions.setHighlights();
    }
  },

  changeYear(e, inputDate) {
    // find the closest year to the mouse
    const closestYear = yearAcc(closestDatum(state.data, yearAcc, inputDate));

    // this is an optimization to ensure that the chart is only re-rendered when underlying state has changed
    if (state.currentYear !== closestYear) {
      state.currentYear = closestYear;
      state.currentMapData = state.data
        .filter((v) => yearAcc(v).getFullYear() === state.currentYear.getFullYear())
        // currentMapData has to be sorted so that d3.bisector will work on it.
        .sort(sortWithAcc(vAcc));

      state.highlightEntity = findEntityWithGeoId(
        geoIdAcc(state.highlightEntity || {}),
        state.currentMapData
      );

      actions.setHighlights();
    }
  },

  // resets the active year
  resetYear() {
    const mostRecentDate = d3.max(state.yearDomain);
    actions.changeYear(mostRecentDate);
  },

  // called when moving over map entities with the mouse. Highlights certain entities
  changeMapEntity(e, d) {
    state.highlightEntity = d.datum;

    actions.setHighlights();
  },

  // reset the highlighted map entity
  resetMapEntity() {
    state.highlightEntity = null;

    actions.setHighlights();
  },

  setHighlights() {
    // highlightData passed to the map is slightly different from the data passed to the line chart.
    // When no entity is highlighted, the map shows nothing special, but the line chart shows the average line.
    state.mapHighlightData = state.highlightEntity ? [state.highlightEntity] : [];
    state.lineHighlightData = state.highlightEntity
      ? [state.highlightEntity]
      : state.averageLine.values.filter(
          (averageObj) => yearAcc(averageObj).getFullYear() === state.currentYear.getFullYear()
        );

    render(state);
  },

  resize() {
    render(state);
  },
};

// Data initialization
// -----------------------------------------------
d3.csv("data/CML_quartier_years.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);

d3.json("../static/topo/stadt-zurich.json").then(actions.prepareMapData).catch(sszvis.loadError);

// Render
// -----------------------------------------------
function render(state) {
  if (state.data === null || state.mapData === null) {
    // loading ...
    return true;
  }

  const props = queryProps(sszvis.measureDimensions("#sszvis-chart"));

  // Bounds for the map section of the chart
  const mapBounds = sszvis.bounds(
    {
      height: props.mapInnerHeight + 30 + props.mapBottomPadding,
      top: 30,
      bottom: props.mapBottomPadding,
    },
    "#sszvis-chart"
  );

  // bounds for the line chart section
  const lineChartBounds = sszvis.bounds(
    {
      height: props.lineChartInnerHeight + props.mapBottomPadding / 2 + 20,
      top: props.mapBottomPadding / 2,
      bottom: 20,
      left: props.lineChartPadding,
      right: props.lineChartPadding,
    },
    "#sszvis-chart"
  );

  const outerBounds = sszvis.bounds(
    {
      height: mapBounds.height + lineChartBounds.height,
    },
    "#sszvis-chart"
  );

  // Scales

  // map fill scale
  const fillScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

  // line chart scales
  const xScale = d3.scaleTime().domain(state.yearDomain).range([0, lineChartBounds.innerWidth]);

  const yScale = d3.scaleLinear().domain(state.valueDomain).range([lineChartBounds.innerHeight, 0]);

  // Layers

  const chart = sszvis.createSvgLayer("#sszvis-chart", outerBounds);

  const map = chart.selectGroup("map").datum(state.currentMapData);

  const lineChart = chart.selectGroup("line").datum(state.lineData);

  const highlightLayer = chart.selectGroup("highlight").datum(state.lineHighlightData);

  const tooltipLayer = sszvis
    .createHtmlLayer("#sszvis-chart", outerBounds)
    .datum(state.mapHighlightData);

  // Components

  const choroplethMap = sszvis
    .choropleth()
    .features(state.mapData.features)
    .borders(state.mapData.borders)
    .lakeFeatures(state.mapData.lakeFeatures)
    .lakeBorders(state.mapData.lakeBorders)
    .highlight(state.mapHighlightData)
    .highlightStroke(sszvis.compose(sszvis.muchDarker, fillScale, vAcc))
    .width(mapBounds.innerWidth)
    .height(mapBounds.innerHeight)
    .transitionColor(false)
    .fill(sszvis.compose(fillScale, vAcc));

  const lineMaker = sszvis
    .line()
    // passing a key function here is important, because the DOM order of the lines is changed
    // by highlighting a line. When a line is highlighted, it is sorted to the front of other lines.
    // This sorting is performed later in the code.
    .key(sszvis.prop("geoId"))
    .valuesAccessor(sszvis.prop("values"))
    .x(sszvis.compose(xScale, yearAcc))
    .y(sszvis.compose(yScale, vAcc))
    .stroke((lineData) => {
      // this function determines whether the line is the highlighted line or not
      const isBlue = state.highlightEntity
        ? state.highlightEntity.geoId === lineData.geoId
        : lineData.geoId === null; // if so, this is the average line
      return isBlue ? state.lineHighlightColor : state.lineBaseColor;
    });

  const xTickValues = [...xScale.ticks(4), state.currentYear];

  const lineXAxis = sszvis.axisX
    .time()
    .scale(xScale)
    .orient("bottom")
    .tickValues(xTickValues)
    .highlightTick(tickIsSelected);

  const lineYAxis = sszvis.axisY().scale(yScale).ticks(3).orient("right").contour(true);

  const rulerLabel = sszvis
    .modularTextSVG()
    .bold(sszvis.compose(sszvis.formatNumber, vAcc))
    .plain((d) => (d.isAverageValue ? "Durchschnitt" : d.name));

  // The bar which marks the current year and shows the value of the highlighted entity
  const handleRuler = sszvis
    .handleRuler()
    .x(xScale(state.currentYear))
    .y(sszvis.compose(yScale, vAcc))
    .top(0)
    .bottom(lineChartBounds.innerHeight)
    .flip((d) => xScale(yearAcc(d)) >= lineChartBounds.innerWidth / 2)
    .color(sszvis.scaleQual12())
    .label(rulerLabel);

  // see the comment by the tooltip in docs/map-standard/kreis.html for more information
  // about accesing data properties of map entities.
  const tooltipHeader = sszvis.modularTextHTML().bold(sszvis.compose(nameAcc, mDatumAcc));

  const tooltip = sszvis
    .tooltip()
    .renderInto(tooltipLayer)
    .orientation(sszvis.fitTooltip("bottom", outerBounds))
    .header(tooltipHeader)
    .body((d) => [
      ["Jahr", sszvis.formatYear(yearAcc(mDatumAcc(d)))],
      ["Einwohner", sszvis.formatNumber(vAcc(mDatumAcc(d)))],
    ])
    .visible(entityIsSelected);

  const legend = sszvis
    .legendColorLinear()
    .scale(fillScale)
    .width(lineChartBounds.innerWidth / 2)
    .labelFormat(sszvis.formatNumber);

  // Rendering

  map
    .attr("transform", sszvis.translateString(mapBounds.padding.left, mapBounds.padding.top))
    .call(choroplethMap);

  map.selectAll("[data-tooltip-anchor]").call(tooltip);

  lineChart
    .attr(
      "transform",
      sszvis.translateString(
        lineChartBounds.padding.left,
        mapBounds.height + lineChartBounds.padding.top
      )
    )
    .call(lineMaker);

  // this sorts the highlighted line to the front of all lines
  lineChart.selectAll(".sszvis-line").sort((a, b) => {
    const highlightId = state.highlightEntity ? state.highlightEntity.geoId : null;
    return a.geoId === highlightId ? 1 : b.geoId === highlightId ? -1 : 0;
  });

  lineChart
    .selectGroup("xAxis")
    .attr("transform", sszvis.translateString(0, lineChartBounds.innerHeight))
    .call(lineXAxis);

  lineChart.selectGroup("yAxis").call(lineYAxis);

  highlightLayer.attr(
    "transform",
    sszvis.translateString(
      lineChartBounds.padding.left,
      mapBounds.height + lineChartBounds.padding.top
    )
  );

  highlightLayer.selectGroup("handleRuler").call(handleRuler);

  chart
    .selectGroup("legend")
    .attr(
      "transform",
      sszvis.translateString(
        lineChartBounds.padding.left + lineChartBounds.innerWidth / 4,
        mapBounds.padding.top + mapBounds.innerHeight + (props.mapBottomPadding * 2) / 3
      )
    )
    .call(legend);

  // Interaction

  const interactionLayer = sszvis
    .panning()
    .elementSelector(".sszvis-map__area")
    .on("start", actions.changeMapEntity)
    .on("pan", actions.changeMapEntity)
    .on("end", actions.resetMapEntity);

  map.call(interactionLayer);

  choroplethMap.on("over", actions.changeMapEntity).on("out", actions.resetMapEntity);

  // add the hover behavior for the line chart, including top padding so that
  // the area around the slide bar handle is responsive to mouse events.
  const hoverBehavior = sszvis
    .move()
    .xScale(xScale)
    .yScale(yScale)
    .padding({ top: 30 })
    .draggable(true)
    .cancelScrolling(true)
    .on("drag", actions.changeYear)
    .on("move", (date, entity) => {
      actions.changeEntityNearDate(entity, date);
    })
    .on("end", actions.resetMapEntity);

  highlightLayer.selectGroup("interaction").call(hoverBehavior);

  sszvis.viewport.on("resize", actions.resize);
}

// Helper functions
// -----------------------------------------------
// given a dataset, an accessor, and a value, find the closest datum in the dataset to that value
function closestDatum(data, accessor, value) {
  const i = d3.bisector(accessor).left(data, value, 1);
  const d0 = data[i - 1];
  const d1 = data[i] || d0;
  return value - accessor(d0) > accessor(d1) - value ? d1 : d0;
}

function findEntityWithGeoId(geoId, data) {
  return sszvis.find((d) => geoIdAcc(d) === geoId, data);
}

function sortWithAcc(acc) {
  return (a, b) => d3.ascending(acc(a), acc(b));
}

function tickIsSelected(d) {
  return sszvis.stringEqual(state.currentYear, d);
}

function entityIsSelected(d) {
  return state.highlightEntity === mDatumAcc(d);
}
