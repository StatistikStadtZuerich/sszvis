#
# make build
#   - no dependencies
#
# make server
#   - fswatch       <http://emcrisostomo.github.io/fswatch/>
#   - browser-sync  <http://www.browsersync.io/>
#

.PHONY: build server

CLI_SUCCESS = \033[1;32m✔
CLI_RESET   = \033[0m

BUILD_TARGET = sszvis.js

VENDOR_FILES = \
	vendor/d3-component/d3-component.js \
	vendor/d3-de/d3-de.js \
	vendor/d3-selectgroup/d3-selectgroup.js \
	vendor/namespace/namespace.js

SOURCE_FILES = \
	sszvis/bounds.js \
	sszvis/color.js \
	sszvis/fn.js \
	sszvis/format.js \
	sszvis/parse.js \
	sszvis/scale.js \
	sszvis/axis.js \
	sszvis/createChart.js \
	sszvis/createHtmlLayer.js \
	sszvis/behavior/mouseover.js \
	sszvis/behavior/move.js \
	sszvis/component/bar.js \
	sszvis/component/line.js \
	sszvis/component/modularText.js \
	sszvis/component/ruler.js \
	sszvis/component/tooltip.js \
	sszvis/component/stackedArea.js \
	sszvis/component/stackedBar.js \
	sszvis/component/groupedBars.js

section = sszvis/banner/_section.js $(1)
VENDOR_FILES_SEP = $(foreach file, $(VENDOR_FILES), $(call section, $(file)))
SOURCE_FILES_SEP = $(foreach file, $(SOURCE_FILES), $(call section, $(file)))

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
		& fswatch -o sszvis/ -o vendor/ | xargs -n1 -I{} make build
