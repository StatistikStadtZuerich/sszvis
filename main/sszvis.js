/**
 * sszvis.js is the visualization library used by Statistik Stadt Zürich.
 * It uses d3.js <http://d3js.org>
 *
 * The following modules are contained within this file:
 *   @VENDOR - various external dependencies
 *   @SSZVIS - the library itself
 *
 * Contact:
 *   Product Owner     - Statistik Stadt Zürich <https://www.stadt-zuerich.ch/statistik>
 *   Technical Contact - Interactive Things <http://interactivethings.com>
 *
 */

function mergeDefaultExport(obj) {
  var keys = Object.keys(obj);
  if (keys.length === 1 && keys[0] === 'default') {
    return obj.default;
  } else {
    var copy = obj.default || {};
    for (var name in obj) {
      if (obj.hasOwnProperty(name)) {
        copy[name] = obj[name];
      }
    }
    return copy;
  }
}


////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  @VENDOR                                                                   //
//                                                                            //
//  External dependencies that need to be available for the                   //
//  to run correctly.                                                         //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

import '../vendor/d3-iecompat/d3-iecompat.js';
import '../vendor/d3-component/d3-component.js';
import '../vendor/d3-de/d3-de.js';
import '../vendor/d3-selectgroup/d3-selectgroup.js';
import '../vendor/d3-selectdiv/d3-selectdiv.js';
import '../vendor/innerSvg-polyfill/innersvg.js';
import '../vendor/sszvis_namespace/sszvis_namespace.js';



////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  @SSZVIS                                                                   //
//                                                                            //
//  The main components of the library                                        //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

if (typeof window !== 'undefined' && typeof window.sszvis !== 'undefined') {
  sszvis.logger.warn('sszvis.js has already been defined in this scope. The existing definition will be overwritten.');
  window.sszvis = {};
}


import * as fn from '../sszvis/fn.js';
sszvis_namespace('sszvis.fn', function(module) {
  module.exports = mergeDefaultExport(fn);
});

import * as scale from '../sszvis/scale.js';
sszvis_namespace('sszvis.scale', function(module) {
  module.exports = mergeDefaultExport(scale);
});

import * as axis from '../sszvis/axis.js';
sszvis_namespace('sszvis.axis', function(module) {
  module.exports = mergeDefaultExport(axis);
});

import * as aspectRatio from '../sszvis/aspectRatio.js';
sszvis_namespace('sszvis.aspectRatio', function(module) {
  module.exports = mergeDefaultExport(aspectRatio);
});

import * as breakpoint from '../sszvis/breakpoint.js';
sszvis_namespace('sszvis.breakpoint', function(module) {
  module.exports = mergeDefaultExport(breakpoint);
});

import * as bounds from '../sszvis/bounds.js';
sszvis_namespace('sszvis.bounds', function(module) {
  module.exports = mergeDefaultExport(bounds);
});

import * as cascade from '../sszvis/cascade.js';
sszvis_namespace('sszvis.cascade', function(module) {
  module.exports = mergeDefaultExport(cascade);
});

import * as color from '../sszvis/color.js';
sszvis_namespace('sszvis.color', function(module) {
  module.exports = mergeDefaultExport(color);
});

import * as createSvgLayer from '../sszvis/createSvgLayer.js';
sszvis_namespace('sszvis.createSvgLayer', function(module) {
  module.exports = mergeDefaultExport(createSvgLayer);
});

import * as createHtmlLayer from '../sszvis/createHtmlLayer.js';
sszvis_namespace('sszvis.createHtmlLayer', function(module) {
  module.exports = mergeDefaultExport(createHtmlLayer);
});

import * as fallback from '../sszvis/fallback.js';
sszvis_namespace('sszvis.fallback', function(module) {
  module.exports = mergeDefaultExport(fallback);
});

import * as format from '../sszvis/format.js';
sszvis_namespace('sszvis.format', function(module) {
  module.exports = mergeDefaultExport(format);
});

import * as loadError from '../sszvis/loadError.js';
sszvis_namespace('sszvis.loadError', function(module) {
  module.exports = mergeDefaultExport(loadError);
});

import * as logger from '../sszvis/logger.js';
sszvis_namespace('sszvis.logger', function(module) {
  module.exports = mergeDefaultExport(logger);
});

import * as parse from '../sszvis/parse.js';
sszvis_namespace('sszvis.parse', function(module) {
  module.exports = mergeDefaultExport(parse);
});

import * as patterns from '../sszvis/patterns.js';
sszvis_namespace('sszvis.patterns', function(module) {
  module.exports = mergeDefaultExport(patterns);
});

import * as responsiveProps from '../sszvis/responsiveProps.js';
sszvis_namespace('sszvis.responsiveProps', function(module) {
  module.exports = mergeDefaultExport(responsiveProps);
});

import * as test from '../sszvis/test.js';
sszvis_namespace('sszvis.test', function(module) {
  module.exports = mergeDefaultExport(test);
});

import * as transition from '../sszvis/transition.js';
sszvis_namespace('sszvis.transition', function(module) {
  module.exports = mergeDefaultExport(transition);
});

import * as annotationCircle from '../sszvis/annotation/circle.js';
sszvis_namespace('sszvis.annotation.circle', function(module) {
  module.exports = mergeDefaultExport(annotationCircle);
});

import * as annotationLine from '../sszvis/annotation/line.js';
sszvis_namespace('sszvis.annotation.line', function(module) {
  module.exports = mergeDefaultExport(annotationLine);
});

import * as annotationRangeRuler from '../sszvis/annotation/rangeRuler.js';
sszvis_namespace('sszvis.annotation.rangeRuler', function(module) {
  module.exports = mergeDefaultExport(annotationRangeRuler);
});

import * as annotationRangeFlag from '../sszvis/annotation/rangeFlag.js';
sszvis_namespace('sszvis.annotation.rangeFlag', function(module) {
  module.exports = mergeDefaultExport(annotationRangeFlag);
});

import * as annotationRectangle from '../sszvis/annotation/rectangle.js';
sszvis_namespace('sszvis.annotation.rectangle', function(module) {
  module.exports = mergeDefaultExport(annotationRectangle);
});

import * as annotationRuler from '../sszvis/annotation/ruler.js';
sszvis_namespace('sszvis.annotation.ruler', function(module) {
  module.exports = mergeDefaultExport(annotationRuler);
});

import * as annotationTooltip from '../sszvis/annotation/tooltip.js';
sszvis_namespace('sszvis.annotation.tooltip', function(module) {
  module.exports = mergeDefaultExport(annotationTooltip);
});

import * as annotationTooltipAnchor from '../sszvis/annotation/tooltipAnchor.js';
sszvis_namespace('sszvis.annotation.tooltipAnchor', function(module) {
  module.exports = mergeDefaultExport(annotationTooltipAnchor);
});

import * as behaviorMove from '../sszvis/behavior/move.js';
sszvis_namespace('sszvis.behavior.move', function(module) {
  module.exports = mergeDefaultExport(behaviorMove);
});

import * as behaviorPanning from '../sszvis/behavior/panning.js';
sszvis_namespace('sszvis.behavior.panning', function(module) {
  module.exports = mergeDefaultExport(behaviorPanning);
});

import * as behaviorUtil from '../sszvis/behavior/util.js';
sszvis_namespace('sszvis.behavior.util', function(module) {
  module.exports = mergeDefaultExport(behaviorUtil);
});

import * as behaviorVoronoi from '../sszvis/behavior/voronoi.js';
sszvis_namespace('sszvis.behavior.voronoi', function(module) {
  module.exports = mergeDefaultExport(behaviorVoronoi);
});

import * as componentBar from '../sszvis/component/bar.js';
sszvis_namespace('sszvis.component.bar', function(module) {
  module.exports = mergeDefaultExport(componentBar);
});

import * as componentDot from '../sszvis/component/dot.js';
sszvis_namespace('sszvis.component.dot', function(module) {
  module.exports = mergeDefaultExport(componentDot);
});

import * as componentGroupedBars from '../sszvis/component/groupedBars.js';
sszvis_namespace('sszvis.component.groupedBars', function(module) {
  module.exports = mergeDefaultExport(componentGroupedBars);
});

import * as componentLine from '../sszvis/component/line.js';
sszvis_namespace('sszvis.component.line', function(module) {
  module.exports = mergeDefaultExport(componentLine);
});

import * as componentPie from '../sszvis/component/pie.js';
sszvis_namespace('sszvis.component.pie', function(module) {
  module.exports = mergeDefaultExport(componentPie);
});

import * as componentPyramid from '../sszvis/component/pyramid.js';
sszvis_namespace('sszvis.component.pyramid', function(module) {
  module.exports = mergeDefaultExport(componentPyramid);
});

import * as componentSankey from '../sszvis/component/sankey.js';
sszvis_namespace('sszvis.component.sankey', function(module) {
  module.exports = mergeDefaultExport(componentSankey);
});

import * as componentStackedArea from '../sszvis/component/stackedArea.js';
sszvis_namespace('sszvis.component.stackedArea', function(module) {
  module.exports = mergeDefaultExport(componentStackedArea);
});

import * as componentStackedAreaMultiples from '../sszvis/component/stackedAreaMultiples.js';
sszvis_namespace('sszvis.component.stackedAreaMultiples', function(module) {
  module.exports = mergeDefaultExport(componentStackedAreaMultiples);
});

import * as componentStackedBar from '../sszvis/component/stackedBar.js';
sszvis_namespace('sszvis.component.stackedBar', function(module) {
  module.exports = mergeDefaultExport(componentStackedBar);
});

import * as componentStackedPyramid from '../sszvis/component/stackedPyramid.js';
sszvis_namespace('sszvis.component.stackedPyramid', function(module) {
  module.exports = mergeDefaultExport(componentStackedPyramid);
});

import * as componentSunburst from '../sszvis/component/sunburst.js';
sszvis_namespace('sszvis.component.sunburst', function(module) {
  module.exports = mergeDefaultExport(componentSunburst);
});

import * as controlButtonGroup from '../sszvis/control/buttonGroup.js';
sszvis_namespace('sszvis.control.buttonGroup', function(module) {
  module.exports = mergeDefaultExport(controlButtonGroup);
});

import * as controlHandleRuler from '../sszvis/control/handleRuler.js';
sszvis_namespace('sszvis.control.handleRuler', function(module) {
  module.exports = mergeDefaultExport(controlHandleRuler);
});

import * as controlSelect from '../sszvis/control/select.js';
sszvis_namespace('sszvis.control.select', function(module) {
  module.exports = mergeDefaultExport(controlSelect);
});

import * as controlSlider from '../sszvis/control/slider.js';
sszvis_namespace('sszvis.control.slider', function(module) {
  module.exports = mergeDefaultExport(controlSlider);
});

import * as layoutHeatTableDimensions from '../sszvis/layout/heatTableDimensions.js';
sszvis_namespace('sszvis.layout.heatTableDimensions', function(module) {
  module.exports = mergeDefaultExport(layoutHeatTableDimensions);
});

import * as layoutHorizontalBarChartDimensions from '../sszvis/layout/horizontalBarChartDimensions.js';
sszvis_namespace('sszvis.layout.horizontalBarChartDimensions', function(module) {
  module.exports = mergeDefaultExport(layoutHorizontalBarChartDimensions);
});

import * as layoutPopulationPyramidLayout from '../sszvis/layout/populationPyramidLayout.js';
sszvis_namespace('sszvis.layout.populationPyramidLayout', function(module) {
  module.exports = mergeDefaultExport(layoutPopulationPyramidLayout);
});

import * as layoutSankey from '../sszvis/layout/sankey.js';
sszvis_namespace('sszvis.layout.sankey', function(module) {
  module.exports = mergeDefaultExport(layoutSankey);
});

import * as layoutSmallMultiples from '../sszvis/layout/smallMultiples.js';
sszvis_namespace('sszvis.layout.smallMultiples', function(module) {
  module.exports = mergeDefaultExport(layoutSmallMultiples);
});

import * as layoutStackedAreaMultiplesLayout from '../sszvis/layout/stackedAreaMultiplesLayout.js';
sszvis_namespace('sszvis.layout.stackedAreaMultiplesLayout', function(module) {
  module.exports = mergeDefaultExport(layoutStackedAreaMultiplesLayout);
});

import * as layoutSunburst from '../sszvis/layout/sunburst.js';
sszvis_namespace('sszvis.layout.sunburst', function(module) {
  module.exports = mergeDefaultExport(layoutSunburst);
});

import * as layoutVerticalBarChartDimensions from '../sszvis/layout/verticalBarChartDimensions.js';
sszvis_namespace('sszvis.layout.verticalBarChartDimensions', function(module) {
  module.exports = mergeDefaultExport(layoutVerticalBarChartDimensions);
});

import * as legendBinnedColorScale from '../sszvis/legend/binnedColorScale.js';
sszvis_namespace('sszvis.legend.binnedColorScale', function(module) {
  module.exports = mergeDefaultExport(legendBinnedColorScale);
});

import * as legendLinearColorScale from '../sszvis/legend/linearColorScale.js';
sszvis_namespace('sszvis.legend.linearColorScale', function(module) {
  module.exports = mergeDefaultExport(legendLinearColorScale);
});

import * as legendOrdinalColorScale from '../sszvis/legend/ordinalColorScale.js';
sszvis_namespace('sszvis.legend.ordinalColorScale', function(module) {
  module.exports = mergeDefaultExport(legendOrdinalColorScale);
});

import * as legendRadius from '../sszvis/legend/radius.js';
sszvis_namespace('sszvis.legend.radius', function(module) {
  module.exports = mergeDefaultExport(legendRadius);
});

import * as mapMapUtils from '../sszvis/map/mapUtils.js';
sszvis_namespace('sszvis.map.utils', function(module) {
  module.exports = mergeDefaultExport(mapMapUtils);
});

import * as mapProjections from '../sszvis/map/projections.js';
sszvis_namespace('sszvis.map.projection', function(module) {
  module.exports = mergeDefaultExport(mapProjections);
});

import * as mapRendererAnchoredCircles from '../sszvis/map/renderer/anchoredCircles.js';
sszvis_namespace('sszvis.map.anchoredCircles', function(module) {
  module.exports = mergeDefaultExport(mapRendererAnchoredCircles);
});

import * as mapRendererBase from '../sszvis/map/renderer/base.js';
sszvis_namespace('sszvis.map.renderer.base', function(module) {
  module.exports = mergeDefaultExport(mapRendererBase);
});

import * as mapRendererGeojson from '../sszvis/map/renderer/geojson.js';
sszvis_namespace('sszvis.map.renderer.geojson', function(module) {
  module.exports = mergeDefaultExport(mapRendererGeojson);
});

import * as mapRendererImage from '../sszvis/map/renderer/image.js';
sszvis_namespace('sszvis.map.renderer.image', function(module) {
  module.exports = mergeDefaultExport(mapRendererImage);
});

import * as mapRendererRaster from '../sszvis/map/renderer/raster.js';
sszvis_namespace('sszvis.map.renderer.raster', function(module) {
  module.exports = mergeDefaultExport(mapRendererRaster);
});

import * as mapRendererMesh from '../sszvis/map/renderer/mesh.js';
sszvis_namespace('sszvis.map.renderer.mesh', function(module) {
  module.exports = mergeDefaultExport(mapRendererMesh);
});

import * as mapRendererHighlight from '../sszvis/map/renderer/highlight.js';
sszvis_namespace('sszvis.map.renderer.highlight', function(module) {
  module.exports = mergeDefaultExport(mapRendererHighlight);
});

import * as mapRendererPatternedlakeoverlay from '../sszvis/map/renderer/patternedlakeoverlay.js';
sszvis_namespace('sszvis.map.renderer.patternedlakeoverlay', function(module) {
  module.exports = mergeDefaultExport(mapRendererPatternedlakeoverlay);
});

import * as svgUtilsCrisp from '../sszvis/svgUtils/crisp.js';
sszvis_namespace('sszvis.svgUtils.crisp', function(module) {
  module.exports = mergeDefaultExport(svgUtilsCrisp);
});

import * as svgUtilsEnsureDefsElement from '../sszvis/svgUtils/ensureDefsElement.js';
sszvis_namespace('sszvis.svgUtils.ensureDefsElement', function(module) {
  module.exports = mergeDefaultExport(svgUtilsEnsureDefsElement);
});

import * as svgUtilsModularText from '../sszvis/svgUtils/modularText.js';
sszvis_namespace('sszvis.svgUtils.modularText', function(module) {
  module.exports = mergeDefaultExport(svgUtilsModularText);
});

import * as svgUtilsTextWrap from '../sszvis/svgUtils/textWrap.js';
sszvis_namespace('sszvis.svgUtils.textWrap', function(module) {
  module.exports = mergeDefaultExport(svgUtilsTextWrap);
});

import * as svgUtilsTranslateString from '../sszvis/svgUtils/translateString.js';
sszvis_namespace('sszvis.svgUtils.translateString', function(module) {
  module.exports = mergeDefaultExport(svgUtilsTranslateString);
});

import * as viewportResize from '../sszvis/viewport/resize.js';
sszvis_namespace('sszvis.viewport', function(module) {
  module.exports = mergeDefaultExport(viewportResize);
});
