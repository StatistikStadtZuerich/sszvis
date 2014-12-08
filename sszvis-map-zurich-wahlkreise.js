/**
 * Modular map component for a map of the Zurich Wahlkreise.
 *
 * The rawTopo reference has raw map data. The compiledTopoJson object contains
 * the geoJson objects compiled from the TopoJSON format. If it's necessary, the getter functions
 * compile the raw topoJson map data into geoJson. This way, the data can be transmitted
 * as much more compact topoJson, and expanded in-memory into the geoJson necessary for rendering
 * map entities. Note that this compilation step requires the topojson client-side library as a
 * dependency (https://github.com/mbostock/topojson/blob/master/topojson.js)
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible id values depend on the map type.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
 * The default key which map.js expects is 'geoId', but by changing the keyName property of the map, you can pass data which
 * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @property {Number} width                           The width of the map. Used to create the map projection function
 * @property {Number} height                          The height of the map. Used to create the map projection function
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {String} borderColor                     A string for the border color of the map entities
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *
 * @return {d3.component}
 */
namespace('sszvis.map.zurichWahlKreise', function(module) {
  'use strict';

  var rawTopo = {"type":"Topology","objects":{"wahlkreis":{"name":"Wahlkreis","type":"GeometryCollection","geometries":[{"type":"Polygon","properties":{"Bezeichnung":"7 + 8"},"id":"7 + 8","arcs":[[0,1,2,3,4]]},{"type":"Polygon","properties":{"Bezeichnung":"9"},"id":"9","arcs":[[5,6,7,8]]},{"type":"Polygon","properties":{"Bezeichnung":"6"},"id":"6","arcs":[[9,10,11,12,13,-3]]},{"type":"Polygon","properties":{"Bezeichnung":"4 + 5"},"id":"4 + 5","arcs":[[14,-11,15,16,-7]]},{"type":"Polygon","properties":{"Bezeichnung":"3"},"id":"3","arcs":[[-8,-17,17,18]]},{"type":"Polygon","properties":{"Bezeichnung":"1 + 2"},"id":"1 + 2","arcs":[[-18,-16,-10,-2,-1,19]]},{"type":"Polygon","properties":{"Bezeichnung":"12"},"id":"12","arcs":[[-4,-14,20,21]]},{"type":"Polygon","properties":{"Bezeichnung":"11"},"id":"11","arcs":[[-21,-13,22,23]]},{"type":"Polygon","properties":{"Bezeichnung":"10"},"id":"10","arcs":[[-15,-6,24,-23,-12]]}]},"lakezurich":{"type":"GeometryCollection","geometries":[{"type":"Polygon","arcs":[[25]]}]},"wahlkreis_lakebounds":{"type":"GeometryCollection","geometries":[{"type":"MultiLineString","arcs":[[26],[0,27],[28]]}]}},"arcs":[[[5965,1803],[-666,1032],[4,921]],[[5303,3756],[295,119],[175,227],[22,113],[-108,133],[99,168],[-115,453]],[[5671,4969],[93,40],[157,186],[-142,172],[285,298],[55,145],[108,27],[136,157],[115,-117],[63,108],[275,260]],[[6816,6245],[348,-129],[175,60],[20,69],[257,-297]],[[7616,5948],[68,3],[51,179],[94,-20],[3,-195],[303,-157],[21,-172],[-108,52],[-71,-89],[147,-56],[-38,-58],[322,-345],[-9,-226],[60,-125],[159,-118],[286,-382],[122,-101],[216,-65],[93,102],[157,34],[67,-138],[-45,-128],[-106,-69],[39,-161],[-53,-106],[298,-46],[144,-101],[-72,-196],[235,-256],[-193,-115],[-204,80],[-328,10],[-122,-87],[-303,19],[-112,-123],[-4,-125],[-267,78],[-244,-4],[-161,139],[-269,-27],[-130,-177],[-86,-20],[-223,-165],[-90,-13],[-372,-163],[-35,77],[-259,-101],[-632,-488]],[[1698,7308],[265,-125],[203,-280],[116,-47],[388,34],[208,-65],[236,-243],[121,-54]],[[3235,6528],[-42,-97],[-136,-17],[-16,-136],[-203,-3],[132,-58],[-100,-87],[-75,-179],[421,-206],[-119,-132],[161,-115],[-149,-188]],[[3109,5310],[-261,-317],[232,-329],[-138,-231],[-226,-173],[-131,-347],[13,-79],[-362,-172],[-242,-360]],[[1994,3302],[-96,151],[-164,91],[-102,-44],[-237,44],[-125,75],[-62,232],[-293,260],[-4,97],[292,260],[48,226],[-146,-33],[-432,344],[-266,51],[-229,7],[-178,182],[306,1],[183,58],[2,131],[100,2],[-53,109],[187,291],[9,87],[231,287],[119,-60],[9,189],[-130,151],[194,7],[92,-51],[160,91],[27,81],[-470,202],[143,410],[589,77]],[[5671,4969],[-111,-4],[-94,192],[-188,34],[-159,291]],[[5119,5482],[-337,300]],[[4782,5782],[189,179],[-1,260],[-223,377],[22,150],[-39,290],[-75,246],[-211,304]],[[4444,7588],[-49,119],[120,111],[427,-237],[136,-50],[163,-185],[-48,-31],[260,-259],[-37,-89],[135,34],[81,-105],[259,240],[112,-125],[61,71]],[[6064,7082],[-118,-175],[60,-72],[271,14],[206,-250],[135,-101],[198,-253]],[[3235,6528],[375,-30],[277,-132],[407,-152],[232,-172],[256,-260]],[[5119,5482],[2,-257],[-78,-199],[-260,-342],[-139,-326],[-127,-109]],[[4517,4249],[-124,68],[-377,459],[-158,48],[-688,472],[-61,14]],[[4517,4249],[-261,-304],[-41,-263],[82,-434],[30,-312],[-114,-141],[-341,-179],[-21,-177],[112,-323],[-95,-82],[-422,36],[-264,-227],[-126,-297],[-14,-136]],[[3042,1410],[-185,298],[-96,243],[66,155],[-102,189],[-199,156],[-109,209],[-51,-10],[-281,361],[-21,176],[-70,115]],[[5965,1803],[-664,-511],[-331,-422],[-245,-57],[-48,-144],[-190,-150],[-191,-7],[-30,-168],[-272,-20],[-68,-65],[-342,-85],[-211,-16],[-265,-158],[-145,223],[22,277],[50,148],[-66,188],[21,244],[64,91],[-12,239]],[[6064,7082],[96,134],[-83,65],[166,263],[-20,537],[22,149],[246,111]],[[6491,8341],[246,81],[105,230],[158,-28],[81,96],[-13,-245],[23,-349],[-34,-163],[834,-297],[50,-35],[431,-93],[-157,-375],[136,-58],[-79,-206],[137,-60],[-57,-179],[-95,58],[-66,-85],[-106,75],[-180,-106],[86,-100],[-131,-146],[-170,-84],[-74,-324]],[[4444,7588],[-91,-21],[-148,203],[-291,156],[-239,16],[-129,54],[-228,4],[-213,165],[-79,-80],[-46,219],[-253,182],[-117,199],[-362,176],[3,31]],[[2251,8892],[122,26],[50,139],[-48,165],[-277,129],[-44,222],[75,108],[554,155],[362,162],[640,-326],[298,84],[334,-55],[49,166],[271,-95],[24,51],[528,-136],[13,66],[186,-37],[-44,127],[293,-118],[412,-77],[106,-572],[-171,-289],[373,-230],[134,-216]],[[1698,7308],[-61,203],[12,257],[-103,50],[101,195],[-141,42],[-116,-160],[-95,31],[-35,135],[-91,-21],[-42,95],[117,196],[-27,169],[112,10],[316,185],[36,206],[196,-67],[22,145],[246,-126],[106,39]],[[5349,1333],[-139,151],[-103,291],[-103,162],[15,172],[-121,378],[39,102],[13,463],[49,188],[-45,114],[2,237],[78,243],[138,141],[237,106],[185,-450],[-5,-337],[190,-306],[-2,-139],[256,-28],[211,-76],[101,-136],[95,-270],[162,-151],[85,-226],[27,-265],[54,-128],[-1071,-1081],[-98,372],[-193,295],[-57,178]],[[5965,1803],[-613,-473]],[[5303,3756],[200,84]],[[6553,2257],[-588,-454]]],"transform":{"scale":[0.000017745235432434138,0.000011445807155725375],"translate":[8.44801822331817,47.3202184380549]}};

  var compiledTopoJson = {
    // feature data - a collection of distinct entities
    featureData: function() { return this._featureData || (this._featureData = topojson.feature(rawTopo, rawTopo.objects.wahlkreis)); },
    // mesh data - a single line that represents all Swiss borders
    meshData: function() { return this._meshData || (this._meshData = topojson.mesh(rawTopo, rawTopo.objects.wahlkreis)); },
    // the lake zurich feature - shared by all three zurich map types
    lakeFeature: function() { return this._lakeFeature || (this._lakeFeature = topojson.feature(rawTopo, rawTopo.objects.lakezurich)); },
    // seebounds: the section of the map bounds which lies over the Zürichsee
    lakeBounds: function() { return this._lakeBounds || (this._lakeBounds = topojson.mesh(rawTopo, rawTopo.objects.wahlkreis_lakebounds)); }
  };

  module.exports = function() {
    var event = d3.dispatch('over', 'out', 'click');

    var base = sszvis.map.renderer.base()
      .geoJson(compiledTopoJson.featureData());

    var mesh = sszvis.map.renderer.mesh()
      .geoJson(compiledTopoJson.meshData());

    var lake = sszvis.map.renderer.patternedlakeoverlay()
      .lakeFeature(compiledTopoJson.lakeFeature())
      .lakeBounds(compiledTopoJson.lakeBounds());

    var highlight = sszvis.map.renderer.highlight()
      .geoJson(compiledTopoJson.featureData());

    var component = d3.component()
      .prop('width')
      .prop('height')
      .prop('keyName').keyName('geoId')
      .delegate('defined', base)
      .delegate('fill', base)
      .delegate('borderColor', mesh)
      .delegate('highlight', highlight)
      .delegate('highlightStroke', highlight)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();


        // Components

        // create a map path generator function
        var mapPath = sszvis.map.utils.swissMapPath(props.width, props.height, compiledTopoJson.featureData());

        // Base shape
        base
          .keyName(props.keyName)
          .mapPath(mapPath);

        // Border mesh
        mesh.mapPath(mapPath);

        // Lake Zurich shape
        lake.mapPath(mapPath);

        // Highlight mesh
        highlight
          .keyName(props.keyName)
          .mapPath(mapPath);


        // Rendering

        selection.call(base)
                 .call(mesh)
                 .call(lake)
                 .call(highlight);


        // Event Binding

        selection.selectAll('[data-event-target]')
          .on('mouseover', function(d) {
            event.over(d.datum);
          })
          .on('mouseout', function(d) {
            event.out(d.datum);
          })
          .on('click', function(d) {
            event.click(d.datum);
          });
      });

    d3.rebind(component, event, 'on');

    return component;
  };

});
