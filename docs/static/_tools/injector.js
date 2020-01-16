// This script is a nasty piece of business, but it's a one-line include
// into any file which will inject our charts onto their page,
// wherever you want them. It's gnarly code tho ¯\_(ツ)_/¯
// to include, add this line:
// <script src="injector.js" id="sszvis-injector" data-component="${SELECTOR_FOR_COMPONENT_WHERE_CHARTS_SHOULD_GO}" data-basepath="${PATH_BACK_TO_THE_DIRECTORY_THAT_HAS_SSZVIS.JS}"></script>

(function() {
  /// ****** The Business Part of the Injector
  var functionCache = (window.__globalRenderFunctionCache__ = {});

  window.__globalRerenderAll__ = function() {
    objForEach(functionCache, function(render) {
      render();
    });
  };

  window.addEventListener("resize", function() {
    __globalRerenderAll__();
  });

  var linkDependencies = ["sszvis.css"];
  var scriptDependencies = [
    "vendor/d3/d3.min.js",
    "vendor/topojson/topojson.js",
    "sszvis.js",
    "map-modules/sszvis-map-switzerland.js",
    "map-modules/sszvis-map-zurich-agglomeration-2012.js",
    "map-modules/sszvis-map-zurich-neubausiedlungen.js",
    "map-modules/sszvis-map-zurich-stadtkreise.js",
    "map-modules/sszvis-map-zurich-statistischequartiere.js",
    "map-modules/sszvis-map-zurich-statistischezonen.js",
    "map-modules/sszvis-map-zurich-topolayer-clipped.js",
    "map-modules/sszvis-map-zurich-topolayer.js",
    "map-modules/sszvis-map-zurich-wahlkreise.js"
  ];
  var allChartsList = [
    "/area-chart-stacked/parametric.html",
    "/area-chart-stacked/sa-three.html",
    "/area-chart-stacked/sa-twelve.html",
    "/area-chart-stacked/sa-two.html",
    "/bar-chart-grouped/basic.html",
    "/bar-chart-grouped/gb-two-small.html",
    "/bar-chart-grouped/gb-two-yearly-long.html",
    "/bar-chart-grouped/parametric.html",
    "/bar-chart-horizontal-stacked/basic.html",
    "/bar-chart-horizontal-stacked/parametric.html",
    "/bar-chart-horizontal/basic.html",
    "/bar-chart-horizontal/interactive.html",
    "/bar-chart-horizontal/parametric.html",
    "/bar-chart-horizontal/percent.html",
    "/bar-chart-vertical-stacked/eight-cat.html",
    "/bar-chart-vertical-stacked/parametric.html",
    "/bar-chart-vertical-stacked/two-cat.html",
    "/bar-chart-vertical/basic.html",
    "/bar-chart-vertical/long-names.html",
    "/bar-chart-vertical/many-years.html",
    "/bar-chart-vertical/parametric.html",
    "/heat-table/ht-binned-linear.html",
    "/heat-table/ht-kreise.html",
    "/heat-table/ht-wermitwem.html",
    "/heat-table/parametric.html",
    "/line-chart-multiple/eight-cat.html",
    "/line-chart-multiple/label-adjustment.html",
    "/line-chart-multiple/parametric.html",
    "/line-chart-multiple/two-axis.html",
    "/line-chart-multiple/two-cat.html",
    "/line-chart-single/annotated.html",
    "/line-chart-single/basic.html",
    "/line-chart-single/interactive.html",
    "/line-chart-single/negatives-x-axis.html",
    "/line-chart-single/parametric.html",
    "/line-chart-single/percentage-negatives-y-axis.html",
    "/map-extended/quartiere-neubau.html",
    "/map-extended/rastermap-bins-100m.html",
    "/map-extended/rastermap-bins-200m.html",
    "/map-extended/rastermap-bins.html",
    "/map-extended/rastermap-gradient.html",
    "/map-extended/topolayer-stadtkreise.html",
    "/map-extended/topolayer-statquart-neubau.html",
    "/map-signature/signature-statisticalquarters.html",
    "/map-signature/signature-statzone.html",
    "/map-standard/agglomeration.html",
    "/map-standard/cml-quartier-years.html",
    "/map-standard/kreis-parametric.html",
    "/map-standard/kreis.html",
    "/map-standard/quartiere-parametric.html",
    "/map-standard/statistische-zonen.html",
    "/map-standard/switzerland.html",
    "/map-standard/quartiere.html",
    "/map-standard/wahlkreis.html",
    "/pie-charts/four-cat.html",
    "/pie-charts/multiples.html",
    "/pie-charts/parametric.html",
    "/pie-charts/twelve-cat.html",
    "/population-pyramid/parametric.html",
    "/population-pyramid/pyramid-basic.html",
    "/population-pyramid/pyramid-reference.html",
    "/population-pyramid/pyramid-stacked.html",
    "/sankey/sankey-same-sets.html",
    "/sankey/sankey-two-column.html",
    "/scatterplot-over-time/scatterplot-over-time.html",
    "/scatterplot/refline-fake.html",
    "/scatterplot/simple-scatterplot-parametric.html",
    "/scatterplot/variable-radius-parametric.html",
    "/scatterplot/variable-radius.html",
    "/scatterplot/years-fake.html",
    "/sunburst/sunburst-four-cat.html",
    "/sunburst/sunburst-three-cat.html",
    "/sunburst/sunburst-two-cat.html"
  ];

  function loadScriptsSequence(list, callback) {
    var copiedList = list.slice(); // defensive clone, not really necessary for this use case, but...
    var name = copiedList.shift();
    var tag = addEl("script", { src: name });
    tag.onload = function() {
      if (!copiedList.length) {
        callback();
      } else {
        loadScriptsSequence(copiedList, callback);
      }
    };
  }

  document.addEventListener("DOMContentLoaded", function() {
    var scriptAnchor = document.querySelector("#sszvis-injector");
    var basepath = scriptAnchor.getAttribute("data-basepath");
    var container = document.querySelector(scriptAnchor.getAttribute("data-component"));
    // Clear the container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // grab the file option, if specified
    var urlParams = getUrlParams();
    var exampleFileList = urlParams.file ? [urlParams.file] : allChartsList;

    linkDependencies.forEach(function(name) {
      addEl("link", { href: basepath + name, rel: "stylesheet" });
    });

    if (window.define) {
      window.define.amd = false;
    } // Screw you dojo

    loadScriptsSequence(
      scriptDependencies.map(function(s) {
        return basepath + s;
      }),
      function() {
        exampleFileList.forEach(function(chartFile, i) {
          var chartId = "sszvis-chart-" + i;
          addLabel(container, i + 1 + ".  " + chartFile);
          addDiv(container, chartId);
          loadFileInto(basepath + chartFile, chartId);
        });
      }
    );
  });

  /// ******* Helpers

  function addDiv(parent, divId) {
    var el = document.createElement("div");
    el.setAttribute("id", divId);
    parent.appendChild(el);
    return el;
  }

  function addLabel(parent, text) {
    var el = document.createElement("div");
    el.innerHTML = text;
    el.style = "margin: 3em 0 2.5em 0; text-align: center;";
    parent.appendChild(el);
    return el;
  }

  function reg(str) {
    return new RegExp(str, "g");
  }

  function objForEach(obj, fn) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        fn(obj[prop], prop, obj);
      }
    }
  }

  // see: http://stackoverflow.com/questions/2592092/executing-script-elements-inserted-with-innerhtml
  function injectScript(scriptText) {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.appendChild(document.createTextNode(scriptText));
    document.querySelector("head").appendChild(script);
    return script;
  }

  function addEl(elname, attrs) {
    var element = document.createElement(elname);
    objForEach(attrs, function(val, attrname) {
      element.setAttribute(attrname, val);
    });
    document.querySelector("head").appendChild(element);
    return element;
  }

  function loadFileInto(fileName, containerId) {
    var req = new XMLHttpRequest();
    req.open("GET", fileName, true);
    req.onload = function() {
      if (!this.status === 200) {
        console.log("request failed: ", fileName);
        return;
      }

      var scriptPrefix = '<script data-catalog-project-expose="script.js">';
      var scriptSuffix = "</script>";
      var exampleScript = this.response.match(reg(scriptPrefix + "([^]*)" + scriptSuffix)).join("");

      exampleScript = exampleScript.replace(reg(scriptPrefix + "|" + scriptSuffix), "");

      var fileFolder = fileName.match(new RegExp("^(.*/)([^/]*)$"))[1];
      exampleScript = exampleScript.replace(reg("data/"), fileFolder + "data/");

      exampleScript = exampleScript.replace(reg("sszvis-chart"), containerId);

      exampleScript = exampleScript.replace(
        reg("}\\(d3"),
        '__globalRenderFunctionCache__["' + containerId + '"] = function() { render(state); }; }(d3'
      );

      injectScript(exampleScript);
    };
    req.onerror = function(err) {
      console.log("failed to load:", fileName, "cause: ", err);
    };
    req.send();
  }

  var regexPlusSign = /\+/g; // Regex for replacing addition symbol with a space
  var regexSearchParam = /([^&=]+)=?([^&]*)/g; // Regex for search param items
  function getUrlParams() {
    var urlParams = {};
    var decode = function(s) {
      return decodeURIComponent(s.replace(regexPlusSign, " "));
    };
    var query = window.location.search.substring(1);
    var match;
    while ((match = regexSearchParam.exec(query))) {
      console.log(match);
      urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
  }
})();
