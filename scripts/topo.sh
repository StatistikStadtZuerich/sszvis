#!/bin/bash

mkdir -p geodata

if [ ! -f geodata/stadtkreise.json ]; then
	curl https://data.stadt-zuerich.ch/dataset/5fd779b6-64b3-4320-baa2-40e4de59dfc6/resource/261666ee-2ca0-43cb-927c-0f610e96cea1/download/stadtkreise.json -o geodata/stadtkreise.json
fi

if [ ! -f geodata/wahlkreise.json ]; then
	curl https://data.stadt-zuerich.ch/dataset/wahlkreis/resource/a9536ffe-2dba-42cf-975d-fe882f9f794a/download/wahlkreis.json -o geodata/wahlkreise.json
fi

if [ ! -f geodata/statistische_quartiere.json ]; then
	curl https://data.stadt-zuerich.ch/dataset/statistisches_quartier/resource/c837926e-035d-48b9-8656-03f1b13c323b/download/statistischequartiere.json -o geodata/statistische_quartiere.json
fi

if [ ! -f geodata/statistische_zonen.json ]; then
	curl https://data.stadt-zuerich.ch/dataset/be458d0f-65b2-44f3-8406-e6e5941f3f85/resource/256e764e-3185-43e7-87c8-ded1f95bd4ff/download/statistischezonen.json -o geodata/statistische_zonen.json
fi

rm -rf dist/topo
mkdir -p dist/topo

geo2topo -q 1e3 -n \
  stadtkreise=<(\
		ndjson-cat geodata/stadtkreise.json \
		| ndjson-split 'd.features' \
		| ndjson-map 'd.id = d.properties.Kreisnummer, d') \
  wahlkreise=<(\
		ndjson-cat geodata/wahlkreise.json \
		| ndjson-split 'd.features' \
		| ndjson-map 'd.id = d.properties.Bezeichnung, d') \
  statistische_zonen=<(\
		ndjson-cat geodata/statistische_zonen.json \
		| ndjson-split 'd.features' \
		| ndjson-map 'd.id = d.properties.Zonennummer, d') \
  statistische_quartiere=<(\
		ndjson-join --left 'd.id' 'd.Quartiernummer' \
			<(\
				ndjson-cat geodata/statistische_quartiere.json \
				| ndjson-split 'd.features' \
				| ndjson-map 'd.id = d.properties.Quartiernummer, d') \
			<(csv2json -n geodata/centers.csv) \
		| ndjson-map 'Object.assign(d[0].properties, d[1]), d[0]' \
		) \
  lakezurich=<(\
		ndjson-cat geodata/lakezurich.geojson \
		| ndjson-split 'd.features') \
  wahlkreis_lakebounds=<(\
		ndjson-cat geodata/lakebounds/wahlkreis_lakebounds.geojson \
		| ndjson-split 'd.features') \
  stadtkreis_lakebounds=<(\
		ndjson-cat geodata/lakebounds/stadtkreis_lakebounds.geojson \
		| ndjson-split 'd.features') \
  statistische_quartiere_lakebounds=<(\
		ndjson-cat geodata/lakebounds/statistische_quartiere_lakebounds.geojson \
		| ndjson-split 'd.features') \
  | toposimplify -f -s 2e-10 \
	> dist/topo/stadt-zurich.json

geo2topo -q 1e3 -n \
  agglomeration=<(\
		ndjson-join --left 'd.id' 'd.Gde_Nr' \
			<(\
				ndjson-cat geodata/agglomeration_2012.json \
				| ndjson-split 'd.features' \
				| ndjson-map 'd.id = d.properties.Gde_Nr, d') \
			<(csv2json -n geodata/agglomeration_2012.csv) \
		| ndjson-map 'Object.assign(d[0].properties, d[1]), d[0]' \
		) \
  lakezurich_lakegreifen=<(\
		ndjson-cat geodata/lakezurich_lakegreifen.geojson \
		| ndjson-split 'd.features' \
		| ndjson-map 'd.id = d.properties.Bezeichnung, d') \
  | toposimplify -f -s 8e-10 \
	> dist/topo/agglomeration-zurich.json

# Already a topojson file
cp -f geodata/ch_cantons.json dist/topo/switzerland.json