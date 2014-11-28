#
# make build
#   - no dependencies
#
# make server
#   - fswatch       <http://emcrisostomo.github.io/fswatch/>
#   - browser-sync  <http://www.browsersync.io/>
#
# make maps
# 	- topojson			<https://github.com/mbostock/topojson>

.PHONY: all build server deploy maps clean

CLI_SUCCESS = \033[1;32m✔
CLI_RESET   = \033[0m

BUILD_TARGET = sszvis.js

VENDOR_FILES = \
	vendor/d3-component/d3-component.js \
	vendor/d3-de/d3-de.js \
	vendor/d3-selectgroup/d3-selectgroup.js \
	vendor/d3-selectdiv/d3-selectdiv.js \
	vendor/innerSvg-polyfill/innersvg.js \
	vendor/namespace/namespace.js

SOURCE_FILES = \
	sszvis/fn.js \
	sszvis/axis.js \
	sszvis/bounds.js \
	sszvis/cascade.js \
	sszvis/color.js \
	sszvis/createSvgLayer.js \
	sszvis/createHtmlLayer.js \
	sszvis/format.js \
	sszvis/loadError.js \
	sszvis/logger.js \
	sszvis/parse.js \
	sszvis/patterns.js \
	sszvis/transition.js \
	sszvis/annotation/circle.js \
	sszvis/annotation/line.js \
	sszvis/annotation/rectangle.js \
	sszvis/behavior/move.js \
	sszvis/behavior/voronoi.js \
	sszvis/control/segmentedControl.js \
	sszvis/control/sliderControl.js \
	sszvis/component/bar.js \
	sszvis/component/dot.js \
	sszvis/component/groupedBars.js \
	sszvis/component/handleRuler.js \
	sszvis/component/line.js \
	sszvis/component/modularText.js \
	sszvis/component/multiples.js \
	sszvis/component/pie.js \
	sszvis/component/pyramid.js \
	sszvis/component/rangeRuler.js \
	sszvis/component/rangeFlag.js \
	sszvis/component/ruler.js \
	sszvis/component/stackedArea.js \
	sszvis/component/stackedAreaMultiples.js \
	sszvis/component/stackedBar.js \
	sszvis/component/stackedPyramid.js \
	sszvis/component/textWrap.js \
	sszvis/component/tooltip.js \
	sszvis/component/tooltipAnchor.js \
	sszvis/layout/heatTableDimensions.js \
	sszvis/layout/horizontalBarChartDimensions.js \
	sszvis/layout/populationPyramidLayout.js \
	sszvis/layout/stackedAreaMultiplesLayout.js \
	sszvis/layout/verticalBarChartDimensions.js \
	sszvis/legend/binnedColorScale.js \
	sszvis/legend/linearColorScale.js \
	sszvis/legend/ordinalColorScale.js \
	sszvis/legend/radius.js \
	sszvis/map/map.js \
	sszvis/map/switzerland.js \
	sszvis/map/zurich.js

section = sszvis/banner/_section.js $(1)
VENDOR_FILES_SEP = $(foreach file, $(VENDOR_FILES), $(call section, $(file)))
SOURCE_FILES_SEP = $(foreach file, $(SOURCE_FILES), $(call section, $(file)))

#
# Map data files
#

ZURICH_MAP_INTERMEDIATE_SOURCE = \
	geodata/statistische_quartiere.geojson

ZURICH_MAP_INTERMEDIATE = \
	geodata/sq_topo.json

ZURICH_MAP_ALL_SOURCE = \
	geodata/stadtkreis.geojson \
	geodata/wahlkreis.geojson \
	geodata/zurichsee.geojson \
	geodata/seebounds/stadtkreis_seebounds.geojson \
	geodata/seebounds/statistische_quartiere_seebounds.geojson \
	geodata/seebounds/wahlkreis_seebounds.geojson

ZURICH_MAP_TARGETS = \
	geodata/zurich_topo.json

CENTER_DATA = geodata/centers.csv


#
# Recipes
#

all: server

build:
	@cat \
		sszvis/banner/_index.js \
		sszvis/banner/_vendor.js \
		$(VENDOR_FILES_SEP) \
		sszvis/banner/_sszvis.js \
		$(SOURCE_FILES_SEP) \
		> $(BUILD_TARGET)
	@echo "$(CLI_SUCCESS) Updated $(BUILD_TARGET)$(CLI_RESET)"

server: build
	@browser-sync start \
	  --server \
		--files=$(BUILD_TARGET) \
		--files="index.html" \
		--files="sszvis.css" \
		--files="docs/**/*" \
		& fswatch -0 -o sszvis/ -o vendor/ | xargs -0 -n1 -I{} make build


deploy: build
	rsync -avz ./ \
	--exclude=.DS_Store \
	--exclude=.git \
	interact@interactivethings.com:/home/interact/www/clients.interactivethings.com/ssz/visualization-library

maps: $(ZURICH_MAP_TARGETS)

clean:
	rm -f $(ZURICH_MAP_TARGETS)

#
# Intermediate files
#

# this intermediate representation is necessary for merging data from centers.csv onto statistische_quartiere.geojson
# If the merge happens during construction of the final zurich_topo.json, then (due to the implementation of topojson.js),
# the shape for Kreis 12 receives the "center" property belonging to Quarter 12. This is of course an error. To avoid this,
# statistische_quartiere.geojson is first compiled to an intermediate topojson file (sq_topo), and the data merge is performed.
# Then, this intermediate file is combined with the other geojson files during construction of zurich_topo.json, and the intermediate
# file is deleted.
geodata/sq_topo.json: $(ZURICH_MAP_INTERMEDIATE_SOURCE)
	mkdir -p $(dir $@)
	topojson -o $@ -e $(CENTER_DATA) --id-property=+QNr -p -- $^

#
# Targets
#

geodata/zurich_topo.json: $(ZURICH_MAP_ALL_SOURCE) $(ZURICH_MAP_INTERMEDIATE)
	mkdir -p $(dir $@)
	topojson -o $@ --id-property=Bezeichnung,+QNr,+KNr -p -- $^
	rm -f $(ZURICH_MAP_INTERMEDIATE)
