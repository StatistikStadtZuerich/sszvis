/* global d3, sszvis */

module.exports = class Page {
  data() {
    return {
      title: "Line Chart | Basic",
      permalink: ({ page }) => `${page.filePathStem}.html`,
      layout: "layouts/external-config",
      config: {
        data: "data/ML_2Categories_Quarterly.csv",
        id: "#sszvis-chart",
        fallback: "fallback.png",
      },
    };
  }

  render() {
    return `
      ${function parseRow(d) {
        return {
          xValue: sszvis.parseDate(d["Datum"]),
          yValue: sszvis.parseNumber(d["Anzahl"]),
          category: d["Kategorie"],
        };
      }.toString()}

      ${function xLabelFormat(d) {
        return d === 0 ? null : sszvis.formatYear(d);
      }.toString()}
      
      ${function yLabelFormat(d) {
        return d === 0 ? null : sszvis.formatNumber(d);
      }.toString()}
      
      ${function xValues(data, accessor) {
        return d3.extent(data, accessor);
      }.toString()}

      ${function mkXScale() {
        return d3.scaleTime();
      }.toString()}

      ${function mkXAxis(ticks, selection, xScale, accessor) {
        // Add the highlighted data as additional ticks to the xScale
        var xTickValues = ticks ? xScale.ticks(ticks) : xScale.ticks();
        xTickValues = xTickValues.concat(selection.map(accessor));
        xTickValues = xTickValues.filter(function (v, i) {
          return xTickValues.map(String).indexOf(String(v)) === i;
        });
        return sszvis.axisX.time().tickValues(xTickValues);
      }.toString()}
      
      ${function closestDatum(data, accessor, datum) {
        var i = d3.bisector(accessor).left(data, datum, 1);
        var d0 = data[i - 1];
        var d1 = data[i] || d0;
        return datum - accessor(d0) > accessor(d1) - datum ? d1 : d0;
      }.toString()}

      ${this.printFileContents("line-chart.js")}
    `;
  }
};
