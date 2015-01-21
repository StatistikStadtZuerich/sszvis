#build cq5 friendly html and replaces all the paths with the ones configured here

.PHONY: clean all d3 data fallback script sszvis template

BASE_PATH=/content/dam/stzh/prd/Deutsch/Statistik/testbereich/ZIK

DATA_FILE=ZIK_Total_Basis_Dez_2010.csv
BASE_NAME=zik
HTML_BASE=$(BASE_NAME).html
HTML_FALLBACK=$(BASE_NAME)_fallback.html


DATA_PATH=$(BASE_PATH)/$(DATA_FILE)
D3_PATH=$(BASE_PATH)/d3.js
SSZVIS_PATH=$(BASE_PATH)/sszvis.js
FALLBACK_PATH=$(BASE_PATH)/fallback.png
SCRIPT_PATH=$(BASE_PATH)/script.js
CSS_PATH=$(BASE_PATH)/sszvis.css

BUILD=build
HTML_NEW=htmlcomponent.html

PATH_TO_DATA_PLACEHOLDER=DATA_CSV
PATH_TO_D3_PLACEHOLDER=D3_JS
PATH_TO_SSZVIS_PLACEHOLDER=SSZVIS_JS
PATH_TO_FALLBACK_PLACEHOLDER=FALLBACK
PATH_TO_SCRIPT_PLACEHOLDER=SCRIPT_JS
PATH_TO_CSS_PLACEHOLDER=SSZVIS_CSS


all: cq5 d3 css data script sszvis template fallback
	@echo done

cq5: 
	@echo creating directory ./$(BUILD)
	@mkdir ./$(BUILD)
	@mkdir ./$(BUILD)/data

css: 
	@echo copy sszvis.css 
	@cp ../../sszvis.css ./$(BUILD)
d3:
	@echo copy d3.js 
	@cp ../../vendor/d3/d3.min.js ./$(BUILD)

data:
	@echo copy $(DATA_FILE)
	@cp ./data/$(DATA_FILE) ./$(BUILD)/data/$(DATA_FILE)

fallback:
	@echo generating fallback.png
	@sed 's=../../sszvis.css=http://localhost:8080/sszvis.css=g' $(HTML_FALLBACK) > fallbacktemp
	@sed 's=../../vendor/d3/d3.min.js=http://localhost:8080/d3.min.js=g' fallbacktemp > fallbacktemp2
	@sed 's=../../sszvis.js=http://localhost:8080/sszvis.js=g' fallbacktemp2 > fallbacktemp3

	@rm fallbacktemp fallbacktemp2
	@mv fallbacktemp3 ./$(BUILD)/fallback.html

	@http-server ./$(BUILD)/ &

	@cp ../../vendor/slimerjs/screenshot.js .
	@slimerjs screenshot.js http://localhost:8080/fallback.html ./$(BUILD)/fallback.png
	@rm screenshot.js
	@rm ./$(BUILD)/fallback.html
	@mv ./$(BUILD)/data/$(DATA_FILE) ./$(BUILD)/$(DATA_FILE)
	@rmdir ./$(BUILD)/data

	@-killall node

script:
	@echo generating script.js
	@xmllint --html --xpath "//html/body/script[@data-catalog-project-expose]/node()" $(HTML_BASE) > ./$(BUILD)/script.js

sszvis:
	@echo copy sszvis.js
	@cp ../../sszvis.js ./$(BUILD)

template:
	@echo generating $(HTML_NEW)
	@cp ../template_cq5.html ./template.html
	@sed 's=$(PATH_TO_D3_PLACEHOLDER)=$(D3_PATH)=g' template.html > temp
	@sed 's=$(PATH_TO_SSZVIS_PLACEHOLDER)=$(SSZVIS_PATH)=g' temp > temp2
	@sed 's=$(PATH_TO_FALLBACK_PLACEHOLDER)=$(FALLBACK_PATH)=g' temp2 > temp3
	@sed 's=$(PATH_TO_SCRIPT_PLACEHOLDER)=$(SCRIPT_PATH)=g' temp3 > temp4
	@sed 's=$(PATH_TO_CSS_PLACEHOLDER)=$(CSS_PATH)=g' temp4 > temp5
	@sed 's=$(PATH_TO_DATA_PLACEHOLDER)=$(DATA_PATH)=g' temp5 > template
	@rm -f template.html temp temp2 temp3 temp4 temp5
	@mv template ./$(BUILD)/$(HTML_NEW)

clean:
	@rm -fr ./$(BUILD)




