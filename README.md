# Stadt Zürich Visualization Library

## Installation

* Make sure you have [Node.js](http://nodejs.org/) installed
* In a console, change into the `prototype` directory
* Run `npm install` to install all dependencies
* Run `npm start` to start the webserver at http://localhost:8080/

## Inputs

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

* d3 evtl. als externe library
* queue verwenden
* jsdoc, aber stzh würde im falle dass selber doc generieren

## Prinzipien

* Deklarativ
* Daten transformieren
* Komponenten kombinieren

In Bezug auf D3

* Nahe am Stil von D3 bleiben
* Nahe an online verfügbaren Beispiele bleiben
* Schlechte Abstraktionen vermeiden
* Kontrolle vor Konfiguration

In Bezug auf Daten

* Daten so vorbereiten wie sie gebraucht werden

In Bezug auf die Anwendung

* Copy/Paste everything as standalone index.html to get started


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
