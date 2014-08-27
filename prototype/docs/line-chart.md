# Line Chart

## Simple Line Chart

Ein Liniendiagramm eignet sich, um die – meistens zeitliche – Veränderung eines Wertes darzustellen.


```bg-plain|run-script
<div id="line-chart"></div>
<script>
    var d3 = sszvis.d3;
    var component = sszvis.component;
    var utils = sszvis.utils;

    d3.csv('/examples/line-chart/simple_line.csv')
      .row(function(d) {
        return {
          date:  d3.time.format("%d.%m.%Y").parse(d['Datum']),
          value: +d['Wert']
        }
      })
      .get(function(error, data) {
        error ? sszvis.error(error) : render(data);
      });

    function render(data) {
      var dim = d3.bounds({width: 700, height: 400, top: 20, right: 20, bottom: 40, left: 60});

      var xScale = d3.time.scale()
        .range([0, dim.innerWidth])
        .domain(d3.extent(data, utils.f.prop('date')));

      var yScale = d3.scale.linear()
        .range([dim.innerHeight, 0])
        .domain(d3.extent(data, utils.f.prop('value')));

      var lineChart = sszvis.chart.line()
        .xScale(xScale)
        .yScale(yScale);

      sszvis.createChart('#line-chart', dim)
        .datum(data)
        .call(lineChart);
    }
</script>
```

[In eigenem Fenster öffnen](examples/line-chart/minimal.html)

### Datenformat

Dieses Chart benötigt zwei Datenreihen:

* x-Achse
* y-Achse

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` – eine `d3`-Achsenfunktion
* `yAxis` – eine `d3`-Achsenfunktion

### Installation

```specimen-code
&lt;div id=&quot;line-chart&quot;&gt;&lt;/div&gt;
&lt;script src=&quot;/assets/sszvis.js&quot;&gt;&lt;/script&gt;
&lt;script&gt;
    var d3 = sszvis.d3;
    var component = sszvis.component;
    var utils = sszvis.utils;

    d3.csv('/examples/line-chart/simple_line.csv')
      .row(function(d) {
        return {
          date:  d3.time.format(&quot;%d.%m.%Y&quot;).parse(d['Datum']),
          value: +d['Wert']
        }
      })
      .get(function(error, data) {
        error ? sszvis.error(error) : render(data);
      });

    function render(data) {
      var dim = d3.bounds({width: 700, height: 400, top: 20, right: 20, bottom: 40, left: 60});

      var xScale = d3.time.scale()
        .range([0, dim.innerWidth])
        .domain(d3.extent(data, utils.f.prop('date')));

      var yScale = d3.scale.linear()
        .range([dim.innerHeight, 0])
        .domain(d3.extent(data, utils.f.prop('value')));

      var lineChart = sszvis.chart.line()
        .xScale(xScale)
        .yScale(yScale);

      sszvis.createChart('#line-chart', dim)
        .datum(data)
        .call(lineChart);
    }
&lt;/script&gt;
```

[Download](docs/downloads/line-chart.zip)
