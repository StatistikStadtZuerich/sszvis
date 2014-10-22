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

.PHONY: build server maps clean

CLI_SUCCESS = \033[1;32m✔
CLI_RESET   = \033[0m

BUILD_TARGET = sszvis.js

VENDOR_FILES = \
	vendor/d3-component/d3-component.js \
	vendor/d3-de/d3-de.js \
	vendor/d3-selectgroup/d3-selectgroup.js \
	vendor/d3-selectdiv/d3-selectdiv.js \
	vendor/namespace/namespace.js

SOURCE_FILES = \
	sszvis/cascade.js \
	sszvis/bounds.js \
	sszvis/color.js \
	sszvis/patterns.js \
	sszvis/fn.js \
	sszvis/transition.js \
	sszvis/format.js \
	sszvis/parse.js \
	sszvis/scale.js \
	sszvis/axis.js \
	sszvis/legendColor.js \
	sszvis/legendColorRange.js \
	sszvis/loadError.js \
	sszvis/createChart.js \
	sszvis/createHtmlLayer.js \
	sszvis/behavior/move.js \
	sszvis/behavior/click.js \
	sszvis/control/segmentedControl.js \
	sszvis/control/slideBar.js \
	sszvis/component/bar.js \
	sszvis/component/dot.js \
	sszvis/component/groupedBars.js \
	sszvis/component/line.js \
	sszvis/component/modularText.js \
	sszvis/component/ruler.js \
	sszvis/component/rangeRuler.js \
	sszvis/component/tooltip.js \
	sszvis/component/tooltipAnchor.js \
	sszvis/component/stackedArea.js \
	sszvis/component/stackedBar.js \
	sszvis/component/textWrap.js \
	sszvis/component/pie.js \
	sszvis/component/multiples.js \
	sszvis/component/pyramid.js \
	sszvis/component/dataAreaCircle.js \
	sszvis/component/dataAreaRectangle.js \
	sszvis/component/dataAreaLine.js \
	sszvis/map/map.js \
	sszvis/map/switzerland.js \
	sszvis/map/zurich.js

section = sszvis/banner/_section.js $(1)
VENDOR_FILES_SEP = $(foreach file, $(VENDOR_FILES), $(call section, $(file)))
SOURCE_FILES_SEP = $(foreach file, $(SOURCE_FILES), $(call section, $(file)))

ZURICH_MAP_TARGETS = \
	geodata/zurich_topo.json

ZURICH_MAPS = \
	geodata/stadtkreise_geo.json \
	geodata/statistische_quartiere_geo.json \
	geodata/wahlkreise_geo.json \
	geodata/zurichsee_geo.json


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

maps: $(ZURICH_MAP_TARGETS)

clean:
	rm $(ZURICH_MAP_TARGETS)

#
# Targets
#
geodata/zurich_topo.json: $(ZURICH_MAPS)
	mkdir -p $(dir $@)
	topojson -o $@ --id-property=Bezeichnung,+QNr,+KNr $^
