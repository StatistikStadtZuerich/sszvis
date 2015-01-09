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

.PHONY: all build server deploy maps clean backup

CLI_SUCCESS = \033[1;32m✔
CLI_RESET   = \033[0m

#create a timestamp for deployment
NOW = $(shell date +"%c" | tr ' :' '-')
BACKUP_FOLDER = sszvis_$(NOW)
DEPLOY_PATH=//szhm0002/StatisticsTools/StatisticsTools/Modules/StyleGuide/
BACKUP_PATH=//szhm0002/StatisticsTools/StatisticsTools/Modules/StyleGuide/old/

BUILD_TARGET = sszvis.js

VENDOR_FILES = \
	vendor/d3-component/d3-component.js \
	vendor/d3-de/d3-de.js \
	vendor/d3-selectgroup/d3-selectgroup.js \
	vendor/d3-selectdiv/d3-selectdiv.js \
	vendor/innerSvg-polyfill/innersvg.js \
	vendor/sszvis_namespace/sszvis_namespace.js

SOURCE_FILES = \
	sszvis/fn.js \
	sszvis/axis.js \
	sszvis/bounds.js \
	sszvis/cascade.js \
	sszvis/color.js \
	sszvis/createSvgLayer.js \
	sszvis/createHtmlLayer.js \
	sszvis/fallback.js \
	sszvis/format.js \
	sszvis/loadError.js \
	sszvis/logger.js \
	sszvis/parse.js \
	sszvis/patterns.js \
	sszvis/scale.js \
	sszvis/transition.js \
	sszvis/annotation/circle.js \
	sszvis/annotation/line.js \
	sszvis/annotation/rangeRuler.js \
	sszvis/annotation/rangeFlag.js \
	sszvis/annotation/rectangle.js \
	sszvis/annotation/ruler.js \
	sszvis/annotation/tooltip.js \
	sszvis/annotation/tooltipAnchor.js \
	sszvis/behavior/move.js \
	sszvis/behavior/voronoi.js \
	sszvis/component/bar.js \
	sszvis/component/dot.js \
	sszvis/component/groupedBars.js \
	sszvis/component/line.js \
	sszvis/component/pie.js \
	sszvis/component/pyramid.js \
	sszvis/component/stackedArea.js \
	sszvis/component/stackedAreaMultiples.js \
	sszvis/component/stackedBar.js \
	sszvis/component/stackedPyramid.js \
	sszvis/control/buttonGroup.js \
	sszvis/control/handleRuler.js \
	sszvis/control/slider.js \
	sszvis/layout/heatTableDimensions.js \
	sszvis/layout/horizontalBarChartDimensions.js \
	sszvis/layout/populationPyramidLayout.js \
	sszvis/layout/smallMultiples.js \
	sszvis/layout/stackedAreaMultiplesLayout.js \
	sszvis/layout/verticalBarChartDimensions.js \
	sszvis/legend/binnedColorScale.js \
	sszvis/legend/linearColorScale.js \
	sszvis/legend/ordinalColorScale.js \
	sszvis/legend/radius.js \
	sszvis/map/mapUtils.js \
	sszvis/map/renderer/base.js \
	sszvis/map/renderer/mesh.js \
	sszvis/map/renderer/highlight.js \
	sszvis/map/renderer/patternedlakeoverlay.js \
	sszvis/svgUtils/crisp.js \
	sszvis/svgUtils/ensureDefsElement.js \
	sszvis/svgUtils/modularText.js \
	sszvis/svgUtils/textWrap.js \
	sszvis/svgUtils/translateString.js

section = docs/banner/_section.js $(1)
VENDOR_FILES_SEP = $(foreach file, $(VENDOR_FILES), $(call section, $(file)))
SOURCE_FILES_SEP = $(foreach file, $(SOURCE_FILES), $(call section, $(file)))

#
# Map data files
#

MAP_TARGETS = \
	geodata/stadtkreis.topojson \
	geodata/wahlkreis.topojson \
	geodata/statistische_quartiere.topojson \
	geodata/ch_cantons.topojson

CENTER_DATA = geodata/centers.csv


#
# Recipes
#

all: server

build:
	@cat \
		docs/banner/_index.js \
		docs/banner/_vendor.js \
		$(VENDOR_FILES_SEP) \
		docs/banner/_sszvis.js \
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

backup: 
	@echo 'backing up...'
	-mv $(DEPLOY_PATH)/sszvis $(BACKUP_PATH)$(BACKUP_FOLDER)
	
deploy: build backup
	@echo 'deploying...'
	mkdir $(DEPLOY_PATH)/sszvis
	cp -r * $(DEPLOY_PATH)/sszvis
	sed -e s/TIMESTAMP/$(NOW)/g $(DEPLOY_PATH)/sszvis/index.html > $(DEPLOY_PATH)/sszvis/index.html.tmp && mv $(DEPLOY_PATH)/sszvis/index.html.tmp $(DEPLOY_PATH)/sszvis/index.html


testsed: 
	#sed -i.bak s/TIMESTAMP/$(NOW)/g index.html
	sed -e s/TIMESTAMP/$(NOW)/g index.html > index.html.tmp && mv index.html.tmp index.html

maps: $(MAP_TARGETS)

clean:
	rm -f $(MAP_TARGETS)

geodata/stadtkreis.topojson: geodata/stadtkreis.geojson geodata/lakezurich.geojson geodata/lakebounds/stadtkreis_lakebounds.geojson
	mkdir -p $(dir $@)
	topojson -o $@ --simplify=2e-10 --id-property=+KNr -p -- $^

geodata/wahlkreis.topojson: geodata/wahlkreis.geojson geodata/lakezurich.geojson geodata/lakebounds/wahlkreis_lakebounds.geojson
	mkdir -p $(dir $@)
	topojson -o $@ --simplify=2e-10 --id-property=Bezeichnung -p -- $^

geodata/statistische_quartiere.topojson: geodata/statistische_quartiere.geojson geodata/lakezurich.geojson geodata/lakebounds/statistische_quartiere_lakebounds.geojson
	mkdir -p $(dir $@)
	topojson -o $@ --simplify=2e-10 -e $(CENTER_DATA) --id-property=+QNr -p -- $^

geodata/ch_cantons.topojson: geodata/ch_cantons_raw.topojson
	mkdir -p $(dir $@)
	topojson -o $@ --simplify=4e-8 -p -- $^
