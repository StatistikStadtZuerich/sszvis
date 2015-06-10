/**
 * Modular map component for a map of the Zurich Stadtkreise.
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
sszvis_namespace('sszvis.map.zurichStadtKreise', function(module) {
  'use strict';

  var rawTopo = {"type":"Topology","objects":{"stadtkreis":{"name":"stadtkreis","type":"GeometryCollection","geometries":[{"type":"Polygon","properties":{"Kname":"Kreis 10","KNr":10},"id":10,"arcs":[[0,1,2,3,4]]},{"type":"Polygon","properties":{"Kname":"Kreis 12","KNr":12},"id":12,"arcs":[[5,6,7,8]]},{"type":"Polygon","properties":{"Kname":"Kreis 11","KNr":11},"id":11,"arcs":[[-8,9,-1,10]]},{"type":"Polygon","properties":{"Kname":"Kreis 8","KNr":8},"id":8,"arcs":[[11,12,13,14]]},{"type":"Polygon","properties":{"Kname":"Kreis 2","KNr":2},"id":2,"arcs":[[15,16,17,18,19,-12,20]]},{"type":"Polygon","properties":{"Kname":"Kreis 3","KNr":3},"id":3,"arcs":[[21,22,23,-16]]},{"type":"Polygon","properties":{"Kname":"Kreis 7","KNr":7},"id":7,"arcs":[[-14,24,25,-6,26]]},{"type":"Polygon","properties":{"Kname":"Kreis 5","KNr":5},"id":5,"arcs":[[27,28,29,30,-3]]},{"type":"Polygon","properties":{"Kname":"Kreis 9","KNr":9},"id":9,"arcs":[[31,-4,-31,32,-23]]},{"type":"Polygon","properties":{"Kname":"Kreis 1","KNr":1},"id":1,"arcs":[[-13,-20,-19,-18,33,-29,34,-25]]},{"type":"Polygon","properties":{"Kname":"Kreis 4","KNr":4},"id":4,"arcs":[[-34,-17,-24,-33,-30]]},{"type":"Polygon","properties":{"Kname":"Kreis 6","KNr":6},"id":6,"arcs":[[-26,-35,-28,-2,-10,-7]]}]},"lakezurich":{"type":"GeometryCollection","geometries":[{"type":"Polygon","arcs":[[35]]}]},"stadtkreis_lakebounds":{"type":"GeometryCollection","geometries":[{"type":"MultiLineString","arcs":[[36,18,37],[38],[11],[39],[40],[41],[42]]}]}},"arcs":[[[2251,8892],[-3,-31],[361,-176],[119,-199],[252,-181],[46,-219],[79,78],[214,-164],[228,-5],[127,-54],[241,-15],[289,-156],[149,-204],[90,23]],[[4443,7589],[213,-304],[73,-246],[40,-292],[-23,-154],[224,-373],[1,-260],[-189,-178]],[[4782,5782],[-256,260],[-232,172],[-406,152],[-279,132],[-375,31]],[[3234,6529],[-119,53],[-236,244],[-209,65],[-387,-34],[-116,47],[-204,279],[-265,125]],[[1698,7308],[-61,203],[12,258],[-103,49],[102,194],[-142,43],[-116,-161],[-95,31],[-34,137],[-93,-22],[-41,95],[116,197],[-26,168],[111,10],[316,185],[37,207],[195,-68],[22,145],[247,-127],[106,40]],[[7616,5948],[-258,297],[-18,-69],[-177,-59],[-347,128]],[[6816,6245],[-198,253],[-134,101],[-208,250],[-271,-14],[-60,73],[119,174]],[[6064,7082],[96,133],[-84,65],[166,264],[-18,537],[22,149],[245,110]],[[6491,8340],[246,82],[106,230],[158,-29],[80,98],[-13,-246],[23,-348],[-33,-164],[834,-297],[50,-35],[430,-93],[-156,-375],[135,-59],[-79,-206],[138,-59],[-58,-179],[-95,58],[-67,-85],[-105,74],[-181,-104],[87,-100],[-132,-148],[-169,-84],[-74,-323]],[[6064,7082],[-61,-71],[-113,125],[-257,-240],[-82,106],[-134,-35],[36,89],[-260,258],[48,33],[-164,184],[-134,49],[-429,238],[-119,-111],[48,-118]],[[2251,8892],[122,27],[49,138],[-46,166],[-279,129],[-43,220],[74,109],[554,155],[363,163],[640,-327],[298,85],[335,-57],[48,166],[270,-95],[25,52],[529,-136],[13,66],[186,-36],[-46,127],[293,-120],[412,-76],[106,-572],[-171,-289],[374,-230],[134,-217]],[[5965,1804],[-667,1032],[5,920]],[[5303,3756],[296,119],[83,127]],[[5682,4002],[338,-111],[313,-240],[36,-127],[110,-96],[162,12],[214,-143],[165,9],[209,-275],[96,-2],[87,-112],[110,15],[72,-78],[198,-4]],[[7792,2850],[-130,-174],[-85,-21],[-224,-165],[-90,-11],[-372,-164],[-35,76],[-258,-100],[-633,-487]],[[3043,1410],[13,137],[126,295],[265,228],[420,-37],[96,82],[-112,323],[22,179],[340,178],[113,141],[-28,312],[-83,433],[40,263],[263,305]],[[4518,4249],[57,30]],[[4575,4279],[65,-83],[186,109],[204,-78],[144,-252]],[[5174,3975],[1,-2]],[[5175,3973],[128,-217]],[[5965,1804],[-664,-511],[-330,-424],[-247,-55],[-46,-145],[-192,-150],[-189,-8],[-31,-167],[-272,-20],[-68,-65],[-341,-85],[-211,-16],[-265,-158],[-146,223],[21,277],[51,149],[-67,187],[21,244],[65,92],[-11,238]],[[3043,1410],[-186,297],[-96,244],[67,154],[-104,190],[-198,156],[-110,209],[-51,-10],[-281,361],[-21,177],[-68,115]],[[1995,3303],[240,360],[363,171],[-12,80],[129,346],[228,174],[138,230],[-234,329],[263,317]],[[3110,5310],[60,-13],[677,-458],[169,-63],[376,-458],[126,-69]],[[5682,4002],[112,212],[-107,134],[100,169],[-115,452]],[[5672,4969],[93,40],[156,185],[-142,173],[285,299],[55,144],[107,27],[137,157],[115,-116],[63,107],[275,260]],[[7616,5948],[68,2],[52,180],[94,-19],[1,-196],[304,-158],[21,-171],[-109,52],[-71,-89],[148,-56],[-38,-58],[321,-344],[-8,-227],[61,-125],[159,-119],[284,-382],[122,-100],[216,-65],[93,102],[158,34],[67,-138],[-45,-127],[-107,-70],[41,-160],[-54,-108],[296,-41],[146,-106],[-72,-195],[235,-256],[-192,-114],[-205,78],[-328,11],[-122,-88],[-303,19],[-112,-121],[-4,-126],[-267,79],[-244,-4],[-162,139],[-268,-31]],[[4782,5782],[337,-301]],[[5119,5481],[-25,-326]],[[5094,5155],[-488,207],[-249,142],[-678,282],[-154,203],[-29,-41],[-253,87],[-274,182]],[[2969,6217],[-131,59],[202,1],[4,111],[149,43],[41,98]],[[1995,3303],[-98,150],[-162,91],[-103,-44],[-238,45],[-124,75],[-63,231],[-292,259],[-5,98],[294,259],[47,227],[-146,-34],[-433,345],[-266,52],[-228,6],[-178,182],[306,1],[182,58],[4,131],[100,2],[-54,109],[187,291],[10,87],[230,287],[119,-59],[10,189],[-131,151],[162,14],[124,-59],[160,92],[27,80],[-469,202],[143,411],[588,76]],[[2969,6217],[-99,-87],[-75,-178],[421,-208],[-120,-130],[162,-117],[-148,-187]],[[4575,4279],[69,79],[139,325],[260,343],[51,129]],[[5119,5481],[158,-289],[188,-35],[96,-192],[111,4]],[[5348,1334],[-144,118],[-95,323],[-110,176],[21,158],[-104,237],[35,707],[48,186],[-45,113],[2,238],[77,243],[286,223],[92,24],[183,-449],[-4,-338],[189,-305],[-1,-139],[255,-29],[212,-76],[101,-136],[94,-270],[161,-150],[86,-225],[28,-268],[52,-125],[-1068,-1084],[-99,373],[-108,213],[-86,83],[-58,179]],[[5174,3975],[0,0]],[[5175,3973],[128,-217]],[[5303,3756],[198,83]],[[5303,3756],[0,0]],[[5965,1804],[-613,-474]],[[5965,1804],[0,0]],[[6552,2256],[-587,-452]]],"transform":{"scale":[0.000017745377574163403,0.000011445821394109267],"translate":[8.44801379462696,47.3202200675953]}};

  var compiledTopoJson = {
    // feature data - a collection of distinct entities
    featureData: function() { return this._featureData || (this._featureData = topojson.feature(rawTopo, rawTopo.objects.stadtkreis)); },
    // mesh data - a single line that represents all Swiss borders
    meshData: function() { return this._meshData || (this._meshData = topojson.mesh(rawTopo, rawTopo.objects.stadtkreis)); },
    // the lake zurich feature - shared by all three zurich map types
    lakeFeature: function() { return this._lakeFeature || (this._lakeFeature = topojson.feature(rawTopo, rawTopo.objects.lakezurich)); },
    // lakebounds: the section of the map bounds which lies over the Zürichsee
    lakeBounds: function() { return this._lakeBounds || (this._lakeBounds = topojson.mesh(rawTopo, rawTopo.objects.stadtkreis_lakebounds)); }
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
      .delegate('transitionColor', base)
      .delegate('borderColor', mesh)
      .delegate('highlight', highlight)
      .delegate('highlightStroke', highlight)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();


        // Components

        // create a map path generator function
        var mapPath = sszvis.map.utils.swissMapPath(props.width, props.height, compiledTopoJson.featureData(), 'stadtkreis');

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
