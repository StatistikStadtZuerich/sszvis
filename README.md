# Stadt Zürich Visualization Library

## Definitionen

* Namespace: `sszvis`

### Entscheidungen

* D3: Deutsche Monatsnamen
* Integration per `<script src=""></script>`
  - `iframe` keine Option
  - `iframe` per skript erstellen?
  - CSS namespacing und CSS von StZH-Seite
  - CORS-Probleme?
* Versionierung der Skripts
* `<noscript>` notwendig, evtl. conditional comments for IElt9
* CMS: HTML-Komponente
* iframe -> verweis auf layoutX.html?script=bla.js
* `<link>` und `<style>` ist verboten
* linting aktivieren

Wünsche:

* 1 Zeile Code für Line-Chart
* Mit der Zeit verstehen, was Code macht
* Z.B. auch Beispiele von D3 kopieren, soll bekannt aussehen
* Möglich zu kopieren von D3?
* möglichst nahe an online-beispielen bleiben

* d3 evtl. als externe library
* queue verwenden
* catalog: copy-paste everything as standalone index.html to get started

* daten: exakt vorbereiten wie es gebraucht wird

bsp. line chart als komponente

* christian zu git-repo einladen

* lodash: lieber utils-lib
* jsdoc, aber stzh würde im falle dass selber doc generieren

this.selectOnce('g')
selection.empty()

scale nicht im store:
  domain: allgemein
  range: abhängig von component

    zvis.csv([u1, u2, u3], function(u1, u2, u3){})


## Prinzipien

* Deklarativ
* Daten transformieren
* Komponenten kombinieren

In Bezug auf D3

* Nahe am Stil von D3 bleiben
* Schlechte Abstraktionen vermeiden
* Kontrolle vor Konfiguration

Die verschiedenen Stile:

    // React-Stil
    zvis.layer({width: 300, height: 100, y: 10}, function(context){})

    // D3-Stil
    zvis.layer().width(300).height(100).y(10).render(function(context){})


## Architektur

* State
  - managed
  - emits change events
* Commands
  - define what happens
* Services
  - fetch data
* Models
  - parse data
    + don't detect data types, provide parsers instead
  - filter data
* View
  - render UI
  - render visualization
    + nested layers
    + plain D3 components
  - trigger commands

Möglicherweise

* Router

## Entwicklung

Um ein neues Chart zu entwickeln, steht folgendes zur Verfügung:

* Core-Library
  - Applikationsarchitektur
  - Applikations-Layouts
  - D3-Komponenten
* Beispiele
* Entwicklungsserver
* fallback, browser-support


## Open questions

* how to set context for scales (need all data)
* all scales 0-1 normalized. will be expanded by layer to fit width/height
* namespace: stzh
* layer: needs access to
  - data
  - context size
* loading state/spinner
* load certain components only
