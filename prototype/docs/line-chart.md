# Line Chart

## Simple Line Chart

Ein Liniendiagramm eignet sich, um die – meistens zeitliche – Veränderung eines Wertes darzustellen.


```bg-plain|run-script
<div data-vis="minimal"></div>
<script>
    initMinimal('[data-vis="minimal"]')
</script>
```

[In eigenem Fenster öffnen](examples/line-chart/minimal.html)

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` – eine `d3`-Achsenfunktion
* `yAxis` – eine `d3`-Achsenfunktion

### Installation

```specimen-code
&lt;div data-vis=&quot;minimal&quot;&gt;&lt;/div&gt;
&lt;script src=&quot;/assets/sszvis.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;minimal.js&quot;&gt;&lt;/script&gt;
&lt;script&gt;
  initMinimal('[data-vis=&quot;minimal&quot;]')
&lt;/script&gt;
```

[Download](docs/downloads/line-chart.zip)
