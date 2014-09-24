.PHONY: watch

SOURCE_FILES = \
	vendor/d3-component/d3-component.js \
	vendor/d3-de/d3-de.js \
	vendor/d3-selectgroup/d3-selectgroup.js

all: server

server:
	@browser-sync start --server --files="**/*"

compiled:
	cat $(SOURCE_FILES) > sszvis_required_compiled.js