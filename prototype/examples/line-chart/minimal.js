window.initMinimal = function(rootSelector) {

  var d3 = sszvis.d3;
  var vis = sszvis.vis;
  var utils = sszvis.utils;

  d3.csv('/examples/line-chart/simple_line.csv')
    .row(parseRow)
    .get(function(error, data) {
      error ? sszvis.error(error) : render(data);
    });

  function render(data) {
    var dim = d3.dimension(700, 400, {top: 20, right: 20, bottom: 40, left: 60});

    var chart = sszvis.createChart(rootSelector, dim)
      .datum(data);

    var lineChart = vis.lineChart()
      .height(dim.height)
      .width(dim.width)

    var xScale = d3.time.scale()
      .range([0, dim.width])
      .domain(d3.extent(data, function(d){return d.date}));

    var yScale = d3.scale.linear()
      .range([dim.height, 0])
      .domain(d3.extent(data, function(d){return d.value}));

    var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
    var yAxis = d3.svg.axis().scale(yScale).orient("left");

    chart.selectGroup('lineChart')
      .call(lineChart)

    chart.selectGroup('xAxis')
      .attr('class', 'x axis')
      .attr('transform', utils.translate(0, dim.height))
      .call(xAxis)

    chart.selectGroup('yAxis')
      .attr('class', 'y axis')
      .call(yAxis)
  }

  function parseRow(d) {
    return {
      date:  d3.time.format("%d.%m.%Y").parse(d['Datum']),
      value: +d['Wert']
    }
  }

};
