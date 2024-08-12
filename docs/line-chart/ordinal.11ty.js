/* global d3, sszvis */

module.exports = class Page {
  data() {
    return {
      title: "Line Chart | Ordinal",
      permalink: ({ page }) => `${page.filePathStem}.html`,
      layout: "layouts/external-config",
      config: {
        data: "data/ML_school_years.csv",
        id: "#sszvis-chart",
        fallback: "fallback.png",
      },
    };
  }

  render() {
    return `
      ${function parseRow(d) {
        return {
          xValue: d["Jahr"],
          yValue: sszvis.parseNumber(d["Wert"]),
          category: null,
        };
      }.toString()}

      ${function xLabelFormat(d) {
        return d === 0 ? null : sszvis.formatText(d);
      }.toString()}

      ${function yLabelFormat(d) {
        return d === 0 ? null : sszvis.formatFractionPercent(d);
      }.toString()}

      ${function xValues(data, accessor) {
        return sszvis.set(data, accessor);
      }.toString()}

      ${function mkXScale() {
        return d3.scalePoint().padding(0);
      }.toString()}

      ${function mkXAxis() {
        return sszvis.axisX.ordinal();
      }.toString()}
      
      ${function closestDatum(data, accessor, datum) {
        return sszvis.find((d) => accessor(d) === datum, data) || data[0];
      }.toString()}

      ${this.printFileContents("line-chart.js")}
    `;
  }
};
