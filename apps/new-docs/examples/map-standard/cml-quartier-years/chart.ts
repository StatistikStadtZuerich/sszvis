/**
 * Choropleth map of the Zurich quarters, linked to a line chart of the same
 * values over time: dragging the ruler picks a year, hovering picks a quarter.
 *
 * @category map-standard
 */

// Magic Numbers

/**
 * Only highlight a quarter if the pointer is within this distance of its line,
 * measured in the y scale's own domain units - inhabitants - not pixels.
 */
const VALUE_PROXIMITY_THRESHOLD = 800;
/** Vertical padding in px above the map. */
const MAP_TOP_PADDING = 30;
/** Extra height in px above the line chart's ruler handle that still reacts to the pointer. */
const HANDLE_TOUCH_PADDING = 30;
const TOPO_URL = "/preview/_static/topo/stadt-zurich.json";

// Types

type Datum = {
  geoId: number;
  year: Date;
  value: number;
  name: string;
};

/**
 * A point on the average line. It is synthesised from all quarters, so it has no
 * quarter of its own - which is what the ruler label keys off to title it.
 */
type AverageDatum = {
  isAverageValue: true;
  year: Date;
  value: number;
};

type LinePoint = Datum | AverageDatum;

/** One line of the chart. The average line is the one with no geo id. */
type LineDatum = {
  geoId: number | null;
  values: LinePoint[];
};

/**
 * What the map binds to each area and to each tooltip anchor: the feature paired
 * with the datum that was matched to it. The pairing is what lets the tooltip be
 * positioned from the geometry, and it is why reading a value means going through
 * `.datum` rather than treating the bound object as the datum itself.
 */
type MapDatum = import("sszvis").MergedGeoDatum<Datum>;

type MapData = {
  features: import("d3").ExtendedFeatureCollection;
  borders: import("d3").GeoPermissibleObjects;
  lakeFeatures: import("d3").GeoPermissibleObjects;
  lakeBorders: import("d3").GeoPermissibleObjects;
};

type State = {
  data: Datum[];
  mapData: MapData;
  valueDomain: [number, number];
  yearDomain: [Date, Date];
  lineData: LineDatum[];
  averageLine: LineDatum;
  currentYear: Date;
  currentMapData: Datum[];
  highlightEntity: Datum | null;
  mapHighlightData: Datum[];
  lineHighlightData: LinePoint[];
};

type Actions = {
  changeYear: (state: State, e: Event, inputDate: Date | null) => void;
  changeEntityNearDate: (
    state: State,
    e: Event,
    inputDate: Date | null,
    inputValue: number | null,
  ) => void;
  changeMapEntity: (state: State, e: Event, d: MapDatum) => void;
  highlightMapEntity: (state: State, datum: Datum | undefined) => void;
  resetMapEntity: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("mapInnerHeight", { _: sszvis.aspectRatioSquare })
  .prop("mapBottomPadding", { palm: 60, _: 90 })
  .prop("lineChartInnerHeight", { palm: 80, _: 100 })
  .prop("lineChartPadding", { palm: 12, lap: (w) => w / 10, _: (w) => w / 5 });

// Accessors

const vAcc = (d: LinePoint) => d.value;
const yearAcc = (d: LinePoint) => d.year;
/** The year as a timestamp, which is what the bisector and the proximity tests compare. */
const timeAcc = (d: LinePoint) => yearAcc(d).getTime();
const geoIdAcc = (d: Datum) => d.geoId;
const nameAcc = (d: Datum) => d.name;

// NOTE: Only the highlighted line is drawn in colour; every other line, the
// average included, is drawn grey.
const LINE_BASE_COLOR = sszvis.scaleGry()(0);
const LINE_HIGHLIGHT_COLOR = sszvis.scaleQual12().range()[0];

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // NOTE: The chart needs both the values and the geometry, so it loads them
  // together; `app()` renders nothing until `init` has resolved.
  init: (state) =>
    Promise.all([
      // NOTE: A row whose year cannot be parsed has no place on either the map or
      // the line chart, and returning null is how d3 is told to drop it.
      d3.csv(config.data, (d) => {
        const year = sszvis.parseYear(d["Jahr"]);
        return year === null
          ? null
          : {
              geoId: sszvis.parseNumber(d["QNr"]),
              year,
              value: sszvis.parseNumber(d["Anzahl"]),
              name: d["Qname"] ?? "",
            };
      }),
      d3.json<Topology>(TOPO_URL),
    ]).then(([data, topo]) => {
      if (topo === undefined) {
        throw new Error(`No topology at ${TOPO_URL}`);
      }
      state.data = data;
      state.mapData = {
        features: topojson.feature(topo, topo.objects["statistische_quartiere"]),
        borders: topojson.mesh(topo, topo.objects["statistische_quartiere"]),
        lakeFeatures: topojson.feature(topo, topo.objects["lakezurich"]),
        lakeBorders: topojson.mesh(topo, topo.objects["statistische_quartiere_lakebounds"]),
      };
      state.valueDomain = [0, d3.max(data, vAcc) ?? 0];
      const [firstYear, lastYear] = d3.extent(data, yearAcc);
      state.yearDomain = [firstYear ?? new Date(), lastYear ?? new Date()];

      // One array of values per quarter, each sorted by year so the lines are drawn
      // in chronological order.
      const cascadedData = sszvis
        .cascade<Datum>()
        .arrayBy(geoIdAcc)
        .sort((a, b) => d3.ascending(timeAcc(a), timeAcc(b)))
        .apply<Datum[][]>(data);

      state.lineData = cascadedData.map((values) => ({
        geoId: geoIdAcc(values[0]),
        values,
      }));

      state.averageLine = {
        // NOTE: The average line is identified by having no geo id, both when it is
        // drawn and when the ruler decides which label to show.
        geoId: null,
        values: averageValues(cascadedData),
      };
      state.lineData.push(state.averageLine);

      state.highlightEntity = null;
      selectYear(state, state.yearDomain[1]);
    }),

  actions: {
    changeYear(state, _e, inputDate) {
      if (inputDate === null) {
        return;
      }
      const closestYear = yearAcc(closestDatum(state.data, timeAcc, inputDate.getTime()));
      // NOTE: Re-render only when the year has actually changed; the pointer moves
      // far more often than the selection does.
      if (state.currentYear.getTime() !== closestYear.getTime()) {
        selectYear(state, closestYear);
      }
    },

    changeEntityNearDate(state, _e, inputDate, inputValue) {
      if (inputDate === null || inputValue === null) {
        return;
      }
      const closestYear = yearAcc(closestDatum(state.data, timeAcc, inputDate.getTime()));

      // Within the closest year, find the quarter whose value is closest to the
      // pointer. Sorted by value, because the search bisects.
      const entitiesForYear = state.data
        .filter((d) => sszvis.stringEqual(closestYear, yearAcc(d)))
        .sort((a, b) => d3.ascending(vAcc(a), vAcc(b)));
      if (entitiesForYear.length === 0) {
        return;
      }

      const closestEntity = closestDatum(entitiesForYear, vAcc, inputValue);
      if (Math.abs(inputValue - vAcc(closestEntity)) >= VALUE_PROXIMITY_THRESHOLD) {
        return;
      }

      // Highlight the quarter's entry from the selected year rather than the one
      // nearest the pointer, so the ruler marks the right point.
      state.highlightEntity = findEntityWithGeoId(geoIdAcc(closestEntity), state.currentMapData);
      setHighlights(state);
    },

    changeMapEntity(state, _e, d) {
      state.highlightEntity = d.datum ?? null;
      setHighlights(state);
    },

    highlightMapEntity(state, datum) {
      state.highlightEntity = datum ?? null;
      setHighlights(state);
    },

    resetMapEntity(state) {
      state.highlightEntity = null;
      setHighlights(state);
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));

    // Bounds for the map section of the chart
    const mapBounds = sszvis.bounds(
      {
        height: props.mapInnerHeight + MAP_TOP_PADDING + props.mapBottomPadding,
        top: MAP_TOP_PADDING,
        bottom: props.mapBottomPadding,
      },
      config.id,
    );

    // Bounds for the line chart section
    const lineChartBounds = sszvis.bounds(
      {
        height: props.lineChartInnerHeight + props.mapBottomPadding / 2 + 20,
        top: props.mapBottomPadding / 2,
        bottom: 20,
        left: props.lineChartPadding,
        right: props.lineChartPadding,
      },
      config.id,
    );

    const outerBounds = sszvis.bounds(
      { height: mapBounds.height + lineChartBounds.height },
      config.id,
    );

    // Scales

    const fillScale = sszvis.scaleSeqBlu().domain(state.valueDomain);

    const xScale = d3.scaleTime().domain(state.yearDomain).range([0, lineChartBounds.innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(state.valueDomain)
      .range([lineChartBounds.innerHeight, 0]);

    // Layers

    const chartLayer = sszvis.createSvgLayer(config.id, outerBounds, {
      title: "Bevölkerung nach Quartier und Jahr",
      description:
        "Karte der statistischen Quartiere für ein gewähltes Jahr, mit dem Verlauf aller Quartiere seit Beginn der Reihe.",
    });

    const map = chartLayer.selectGroup("map").datum(state.currentMapData);

    const lineChart = chartLayer.selectGroup("line").datum(state.lineData);

    const highlightLayer = chartLayer.selectGroup("highlight").datum(state.lineHighlightData);

    const tooltipLayer = sszvis
      .createHtmlLayer(config.id, outerBounds)
      .datum(state.mapHighlightData);

    // Components

    const choroplethMap = sszvis
      .choropleth<Datum>()
      .features(state.mapData.features)
      .borders(state.mapData.borders)
      .lakeFeatures(state.mapData.lakeFeatures)
      .lakeBorders(state.mapData.lakeBorders)
      .highlight(state.mapHighlightData)
      .highlightStroke((d) => sszvis.muchDarker(fillScale(vAcc(d))))
      .width(mapBounds.innerWidth)
      .height(mapBounds.innerHeight)
      .transitionColor(false)
      // NOTE: A feature that matched no datum gets the missing-value texture and
      // never reaches this accessor, so the undefined branch is only here to name
      // the case the signature allows.
      .fill((d) => (d === undefined ? "none" : fillScale(vAcc(d))));

    const lineMaker = sszvis
      .line<LinePoint, LineDatum>()
      // NOTE: The key matters here, because highlighting a line sorts it to the
      // front of its siblings further down.
      .key((l) => l.geoId ?? "average")
      .valuesAccessor((l) => l.values)
      .x((d) => xScale(yearAcc(d)))
      .y((d) => yScale(vAcc(d)))
      .stroke((l) => (isHighlightedLine(state)(l) ? LINE_HIGHLIGHT_COLOR : LINE_BASE_COLOR));

    const lineXAxis = sszvis.axisX
      .time()
      .scale(xScale)
      .orient("bottom")
      .tickValues([...xScale.ticks(4), state.currentYear])
      .highlightTick((d) => sszvis.stringEqual(state.currentYear, d));

    const lineYAxis = sszvis.axisY().scale(yScale).ticks(3).orient("right").contour(true);

    const rulerLabel = sszvis
      .modularTextSVG()
      .bold((d: LinePoint) => sszvis.formatNumber(vAcc(d)))
      .plain((d: LinePoint) => ("isAverageValue" in d ? "Durchschnitt" : nameAcc(d)));

    // The bar which marks the current year and shows the value of the highlighted entity
    const handleRuler = sszvis
      .handleRuler<LinePoint>()
      .x(xScale(state.currentYear))
      .y((d) => yScale(vAcc(d)))
      .top(0)
      .bottom(lineChartBounds.innerHeight)
      .flip((d) => xScale(yearAcc(d)) >= lineChartBounds.innerWidth / 2)
      .color(LINE_HIGHLIGHT_COLOR)
      .label(rulerLabel);

    const tooltipHeader = sszvis
      .modularTextHTML()
      .bold((d: MapDatum) => (d.datum === undefined ? "" : nameAcc(d.datum)));

    const tooltip = sszvis
      .tooltip<MapDatum>()
      .renderInto(tooltipLayer)
      .orientation(sszvis.fitTooltip("bottom", outerBounds))
      .header(tooltipHeader)
      .body((d) =>
        d.datum === undefined
          ? []
          : [
              ["Jahr", sszvis.formatYear(yearAcc(d.datum))],
              ["Einwohner", sszvis.formatNumber(vAcc(d.datum))],
            ],
      )
      .visible((d) => d.datum !== undefined && state.highlightEntity === d.datum);

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
          mapBounds.height + lineChartBounds.padding.top,
        ),
      )
      .call(lineMaker);

    // This sorts the highlighted line to the front of all lines.
    // NOTE: The datum annotations are load-bearing - `createSvgLayer` reaches the
    // examples as `any`, so nothing downstream of it is inferred.
    lineChart
      .selectAll(".sszvis-line")
      .sort((a: LineDatum, b: LineDatum) =>
        isHighlightedLine(state)(a) ? 1 : isHighlightedLine(state)(b) ? -1 : 0,
      );

    lineChart
      .selectGroup("xAxis")
      .attr("transform", sszvis.translateString(0, lineChartBounds.innerHeight))
      .call(lineXAxis);

    lineChart.selectGroup("yAxis").call(lineYAxis);

    highlightLayer.attr(
      "transform",
      sszvis.translateString(
        lineChartBounds.padding.left,
        mapBounds.height + lineChartBounds.padding.top,
      ),
    );

    highlightLayer.selectGroup("handleRuler").call(handleRuler);

    chartLayer
      .selectGroup("legend")
      .attr(
        "transform",
        sszvis.translateString(
          lineChartBounds.padding.left + lineChartBounds.innerWidth / 4,
          mapBounds.padding.top + mapBounds.innerHeight + (props.mapBottomPadding * 2) / 3,
        ),
      )
      .call(legend);

    // Interaction

    const interactionLayer = sszvis
      .panning<MapDatum>()
      .elementSelector(".sszvis-map__area")
      .on("start", actions.changeMapEntity)
      .on("pan", actions.changeMapEntity)
      .on("end", actions.resetMapEntity);

    map.call(interactionLayer);

    choroplethMap.on("over", actions.highlightMapEntity).on("out", actions.resetMapEntity);

    // NOTE: The top padding makes the area around the ruler handle respond to the
    // pointer, so the handle can be grabbed from slightly above the chart area.
    const hoverBehavior = sszvis
      .move<Date, number>()
      .xScale(xScale)
      .yScale(yScale)
      .padding({ top: HANDLE_TOUCH_PADDING })
      .draggable(true)
      .cancelScrolling(true)
      .on("drag", actions.changeYear)
      .on("move", actions.changeEntityNearDate)
      .on("end", actions.resetMapEntity);

    highlightLayer.selectGroup("interaction").call(hoverBehavior);
  },
});

// Helper functions

/**
 * The average of all quarters, year by year. The quarters all share one series of
 * years, so the values line up by index.
 */
const averageValues = (cascadedData: Datum[][]): AverageDatum[] =>
  cascadedData.reduce<AverageDatum[]>((averages, values) => {
    for (const [index, datum] of values.entries()) {
      averages[index] ??= { isAverageValue: true, year: yearAcc(datum), value: 0 };
      averages[index].value += Math.round(vAcc(datum) / cascadedData.length);
    }
    return averages;
  }, []);

/**
 * Moves the chart to a year: the map shows that year's values, and the highlighted
 * quarter - if there is one - follows to its entry for the new year.
 */
const selectYear = (state: State, year: Date) => {
  state.currentYear = year;
  // Sorted by value, because changeEntityNearDate bisects this array.
  state.currentMapData = state.data
    .filter((d) => yearAcc(d).getFullYear() === year.getFullYear())
    .sort((a, b) => d3.ascending(vAcc(a), vAcc(b)));
  state.highlightEntity =
    state.highlightEntity === null
      ? null
      : findEntityWithGeoId(geoIdAcc(state.highlightEntity), state.currentMapData);
  setHighlights(state);
};

/**
 * With a quarter highlighted, both the map and the ruler point at it. With none,
 * the map shows nothing special and the ruler falls back to the average line.
 */
const setHighlights = (state: State) => {
  state.mapHighlightData = state.highlightEntity === null ? [] : [state.highlightEntity];
  state.lineHighlightData =
    state.highlightEntity === null
      ? state.averageLine.values.filter(
          (d) => yearAcc(d).getFullYear() === state.currentYear.getFullYear(),
        )
      : [state.highlightEntity];
};

/**
 * The datum whose accessor value is nearest `value`. `data` has to be sorted by
 * that accessor already, since the search bisects it.
 */
const closestDatum = <T>(data: T[], accessor: (d: T) => number, value: number): T => {
  const index = d3.bisector(accessor).left(data, value, 1);
  const before = data[index - 1];
  const after = data[index] ?? before;
  return value - accessor(before) > accessor(after) - value ? after : before;
};

const findEntityWithGeoId = (geoId: number, data: Datum[]) =>
  data.find((d) => geoIdAcc(d) === geoId) ?? null;

/** The highlighted line, or - with nothing highlighted - the average line. */
const isHighlightedLine = (state: State) => (line: LineDatum) =>
  state.highlightEntity === null
    ? line.geoId === null
    : geoIdAcc(state.highlightEntity) === line.geoId;
