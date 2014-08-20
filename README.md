# Stadt Zürich Visualization Library

## Agenda

* Technologieentscheidungen vorstellen
  - Core library
  - Examples
* Catalog vorstellen

* Namespace: momentan `zvis`
* Lokaler Server für Entwicklung der Produkte, z.B. `python -m SimpleHTTPServer`


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

## Open questions

* how to set context for scales (need all data)
* all scales 0-1 normalized. will be expanded by layer to fit width/height
* namespace: stzh
* layer: needs access to
  - data
  - context size
* loading state/spinner
* load certain components only
