/**
 * Modular map component for a map of the cantons of Switzerland.
 */

/**
 * The rawTopo reference has raw map data. The module object contains
 * the geoJson objects compiled from the TopoJSON format. If it's necessary, the getter functions
 * compile the raw topoJson map data into geoJson. This way, the data can be transmitted
 * as much more compact topoJson, and expanded in-memory into the geoJson necessary for rendering
 * map entities. Note that this compilation step requires the topojson client-side library as a
 * dependency (https://github.com/mbostock/topojson/blob/master/topojson.js)
 */
sszvis_namespace('sszvis.map.switzerlandMapData', function(module) {
  'use strict';

  var rawTopo = {"type":"Topology","objects":{"cantons":{"type":"GeometryCollection","geometries":[{"type":"MultiPolygon","id":22,"arcs":[[[0,1,2,3,4,5,6,7,8,9,10],[11],[12],[13]],[[14,15,16,17,18]]]},{"type":"Polygon","id":21,"arcs":[[19,20,21,22]]},{"type":"Polygon","id":18,"arcs":[[-23,23,24,25,26]]},{"type":"MultiPolygon","id":10,"arcs":[[[27,-16,28,-19,29,-7],[30]],[[31,-5]],[[-12]],[[-14]],[[32]]]},{"type":"MultiPolygon","id":2,"arcs":[[[-8,-30,-18,33,34,35,36,37,38,39,40,41,42],[43],[-33]],[[-15,-29]],[[-31]],[[44,45]]]},{"type":"Polygon","id":19,"arcs":[[-37,46,47,48,49,50,51]]},{"type":"MultiPolygon","id":11,"arcs":[[[-44]],[[-46,52,53,-47,-36]],[[54,55]],[[56,57,58]]]},{"type":"Polygon","id":26,"arcs":[[59,60,61,62,-53,-45,-35]]},{"type":"Polygon","id":3,"arcs":[[63,64,65,66,-38,-52]]},{"type":"Polygon","id":9,"arcs":[[67,-64,-51,68]]},{"type":"MultiPolygon","id":17,"arcs":[[[69,70,71,72,-26,73],[74,75,76,77,78,79],[80]],[[81]]]},{"type":"Polygon","id":1,"arcs":[[-50,82,83,84,85,86,87,-71,88,-69]]},{"type":"MultiPolygon","id":13,"arcs":[[[-63,-59,89,-56,90,91,92,-48,-54]],[[-57,-62,93]]]},{"type":"Polygon","id":15,"arcs":[[-80,94,-78,95,-76,96]]},{"type":"Polygon","id":24,"arcs":[[-17,-28,-6,-32,-4,97,-60,-34]]},{"type":"Polygon","id":23,"arcs":[[-9,-43,98,-21,99]]},{"type":"MultiPolygon","id":25,"arcs":[[[-2,100]],[[-13]],[[101,-11]]]},{"type":"Polygon","id":4,"arcs":[[-22,-99,-42,102,103,104,105,-24]]},{"type":"MultiPolygon","id":20,"arcs":[[[106,107,108,109,110,-72,-88],[-82]],[[-81]]]},{"type":"Polygon","id":5,"arcs":[[-68,-89,-70,111,-105,112,-65]]},{"type":"Polygon","id":8,"arcs":[[-25,-106,-112,-74]]},{"type":"MultiPolygon","id":16,"arcs":[[[-75,-97]],[[-77,-96]],[[-79,-95]]]},{"type":"MultiPolygon","id":6,"arcs":[[[-39,-67,113]],[[-103,-41,114]]]},{"type":"Polygon","id":7,"arcs":[[-113,-104,-115,-40,-114,-66]]},{"type":"Polygon","id":12,"arcs":[[-92,115]]},{"type":"MultiPolygon","id":14,"arcs":[[[116,-84]],[[-110,117]],[[-108,118,-86,119]]]}]}},"arcs":[[[609,2574],[-29,-94]],[[580,2480],[-46,-139],[-127,102],[-33,64]],[[374,2507],[97,247],[-158,211],[-76,39],[47,122],[-27,127],[54,79],[34,142],[96,178],[-101,158],[152,198],[195,304],[3,31],[252,243],[38,99],[52,18],[74,170],[-51,66],[56,252]],[[1111,5191],[49,-25],[90,51],[140,137],[89,24],[43,109],[163,129],[-8,-152],[50,-55],[0,-115],[89,-98]],[[1816,5196],[-84,-126],[124,-225],[59,-49],[76,75],[45,-62],[69,21],[44,130],[-43,-13],[-19,128],[61,125],[-22,91],[-120,191]],[[2006,5482],[65,79]],[[2071,5561],[153,-301],[18,110],[35,-69],[-27,-117],[18,-141],[-43,30],[2,-128],[-37,-100],[-91,-126],[73,-64],[-115,-256],[-58,-64],[-22,-130],[-43,35],[-82,-146],[16,-122],[-19,-169],[41,52],[111,-39],[53,-101],[-50,-92],[-89,-8],[-32,-63],[58,-127],[58,-31],[40,94],[153,-50],[50,-65],[24,-259],[75,45],[4,63],[101,148],[86,1],[68,94],[19,93],[105,100],[34,-69],[65,106]],[[2823,3695],[24,-215],[-56,-347],[-60,-7],[32,-122],[-35,-188],[32,-1],[29,-249]],[[2789,2566],[-71,-126],[17,-74],[-101,-225],[-139,-216],[-119,-68],[-47,87],[-57,236],[-108,225],[-18,168],[-106,118],[8,104],[-142,263]],[[1906,3058],[-307,138],[-359,10],[-205,-205],[-199,-61],[-183,-216],[-25,-85]],[[628,2639],[-135,105],[-15,-48],[131,-122]],[[1885,4570],[37,37],[74,-54],[44,126],[-65,124],[-90,-233]],[[502,2650],[0,0]],[[1747,4589],[31,-72],[52,152],[-83,-80]],[[2501,5452],[-16,-38]],[[2485,5414],[-89,-246],[-18,134],[-237,400]],[[2141,5702],[164,167],[84,-34]],[[2389,5835],[26,-14]],[[2415,5821],[14,-194],[72,-175]],[[7061,1765],[-84,-175],[-109,-84],[37,-139],[-23,-126],[-134,-78],[-19,-116],[43,-165],[-87,-120],[55,-48],[12,-161],[52,-3],[101,-155],[-69,-109],[-55,-274],[-84,7],[-99,108],[-83,-65],[55,185],[-27,179],[-69,145],[2,135],[-34,-12],[-103,158],[-87,20],[2,81],[112,204],[17,136],[-101,128],[-51,-36],[-89,141],[-62,-125],[-126,78],[-21,54],[-79,-8],[-42,106],[22,63],[-64,48],[-72,164],[-19,103],[-142,74],[-53,81],[26,74],[-63,173],[83,180],[13,311],[-31,136],[21,100],[-45,104],[-134,-58]],[[5354,3184],[15,214],[113,3],[77,163]],[[5559,3564],[92,57],[-14,99],[56,141],[114,-67],[79,14],[47,-53],[69,67]],[[6002,3822],[85,-41],[73,26],[110,-65],[69,4],[169,115],[-8,127],[116,92],[10,-140],[98,42],[80,-111],[-59,-285],[16,-121],[82,-159],[55,-6],[3,-159],[34,-164],[-34,-111],[4,-197],[-55,-112],[25,-64],[-45,-99],[51,-174],[26,-240],[48,-38],[106,-177]],[[6002,3822],[-5,202],[-56,74],[59,151],[-9,141],[77,36],[88,108],[46,119],[27,-82],[69,46],[9,125],[37,23],[-14,125],[108,107]],[[6438,4997],[84,-10],[30,-73],[202,105],[58,248],[107,22],[36,-104],[65,58],[27,90],[78,-17],[133,200]],[[7258,5516],[40,-64],[95,11],[158,-41],[114,-64],[33,-61],[65,240],[94,257],[55,25],[-64,130],[-90,247]],[[7758,6196],[142,68],[44,-83],[94,67],[52,-54],[101,40],[172,-113],[76,8],[103,-118],[62,40],[73,-163],[-48,-136],[12,-143],[135,-105],[93,6],[84,-67],[79,-129],[-4,-62],[90,-24],[28,-91],[115,35],[79,94],[87,0],[-15,153],[33,175],[117,-49],[48,18],[-14,123],[40,19],[43,182],[92,54],[84,-129],[-9,-80],[144,-107],[-41,-290],[5,-157],[-53,-241],[-48,-59],[35,-88],[-14,-95],[-78,-97],[39,-74],[-75,-161],[56,-259],[82,31],[101,-130],[-45,-361],[-42,-63],[-77,100],[-46,-34],[-98,57],[-31,-65],[-97,47],[-15,93],[-73,3],[-28,107],[38,91],[-75,98],[-21,-65],[-72,34],[-121,-94],[-56,27],[-16,-166],[-92,-230],[-32,-426],[55,-107],[81,-22],[93,36],[39,-62],[7,-128],[-79,-62],[4,-86],[-54,-138],[125,-258],[29,-140],[-64,-121],[-94,-10],[-71,-57],[-61,63],[38,93],[-14,93],[-130,92],[12,95],[-46,97],[31,147],[-91,135],[-60,-68],[-39,75],[-93,-81],[-72,-17],[-123,-133],[-74,87],[-45,-57],[-19,-240],[-84,50],[-90,-83],[-190,81],[-53,84],[-69,231],[-68,45],[-19,238],[23,242],[-9,181],[-60,-39],[-46,-155],[-52,30],[-35,156],[-139,0],[-60,-36],[-12,-178],[-68,-74],[2,-69],[76,-140],[-11,-166],[41,-83],[8,-141],[-34,-150],[-75,-157],[-8,-174],[-56,-12],[-41,-105],[-17,-146],[-78,-49]],[[2071,5561],[70,141]],[[2485,5414],[16,38]],[[2415,5821],[92,-3],[148,56],[125,96],[38,-101],[-61,-114],[2,-275],[-44,-44],[158,-12],[48,-43],[98,23],[62,-40],[12,-110],[-52,-68],[-74,8],[60,-85],[-86,-313],[38,-281],[91,-23],[-9,-68],[71,-31],[-41,-245],[-82,54],[-17,-91],[16,-225],[-87,-41],[-98,-150]],[[2563,5446],[0,0]],[[1816,5196],[190,286]],[[2818,5601],[0,0]],[[2389,5835],[-32,132],[17,117],[121,149],[-27,187],[-116,80],[38,60],[-269,-95],[-114,-100],[48,230],[-59,173]],[[1996,6768],[49,-76],[119,124],[8,48],[85,-53],[36,97],[59,11],[77,232],[66,-24],[149,54],[-28,41],[57,94],[1,83],[54,24],[108,-52],[164,25],[43,76],[92,48],[95,-43],[173,-17],[128,97]],[[3531,7557],[-57,-142],[-82,-31],[-65,-118],[-108,-62],[10,-47],[-178,-127],[30,-131],[124,-148],[83,132],[108,-91],[-40,-81],[-54,11],[-72,-103],[39,-57],[-151,-18],[42,-143],[96,41],[16,-132],[76,63],[-31,108],[109,92],[41,111],[-19,57],[83,40],[67,-86],[125,-10],[72,171],[-67,94],[-15,141],[-99,80],[-34,153],[151,31],[79,59],[106,-175],[91,42],[111,-9]],[[4118,7272],[32,-157]],[[4150,7115],[48,-214],[48,-101],[17,-158],[-49,-117],[30,-143],[-33,-193],[75,-162],[123,-74],[-23,-174],[-67,-170],[-93,-48],[21,-109],[-53,-91],[41,-242],[100,-86],[136,-228],[142,66]],[[4613,4871],[91,-1],[26,-69],[98,-94],[46,54],[159,18],[96,-83],[110,140],[80,35]],[[5319,4871],[58,-83]],[[5377,4788],[118,-34]],[[5495,4754],[7,-382],[-116,22],[24,-200]],[[5410,4194],[-91,-123],[-11,-230],[-60,-110],[-174,-159],[-170,-44],[-14,54],[-108,30],[-25,46],[-185,81],[-72,-22],[-77,-108],[18,-102],[-131,-149],[-150,-44],[-143,-174],[-154,-148],[-183,156],[-69,-168],[-133,-8],[47,-106],[-37,-58],[-117,-25],[-104,69],[-100,-64],[-86,-115],[-86,-32],[-10,157],[-107,-85],[-18,-139],[-71,-8]],[[3826,6761],[0,0]],[[3531,7557],[-67,0],[54,115]],[[3518,7672],[13,-115]],[[4118,7272],[85,210],[79,65],[26,96],[83,-36],[0,-75],[125,97],[48,161],[0,134],[-141,134],[53,56],[-42,150],[-23,-41]],[[4411,8223],[-37,35],[10,119],[-87,-5],[-31,113],[-86,140],[-99,-190],[-39,109],[-116,42],[-53,61]],[[3873,8647],[183,91],[50,148],[144,10],[44,-44],[26,-161],[69,-19],[29,69],[128,-38],[90,66],[53,-31],[46,102],[69,30],[111,111],[26,65],[59,-61],[76,43],[85,-49],[2,-84],[73,-91],[115,-26],[39,55],[55,-45]],[[5445,8788],[-48,-166],[-96,-122],[-7,-64],[75,-387],[-27,-104],[61,-148],[20,-231],[74,31],[-45,-149],[-71,-65],[29,-201]],[[5410,7182],[-34,-107],[44,-303],[-7,-129]],[[5413,6643],[-80,-6],[-81,196],[-85,467],[-110,74],[-48,-66],[-57,-217],[-59,-40],[-44,89],[42,69],[-145,-43],[-23,78],[-94,-23],[14,-46],[-104,-11],[-45,187],[-101,-43],[28,-93],[-62,-93],[-54,41],[-155,-48]],[[3518,7672],[-61,132],[-146,-5],[-48,47]],[[3263,7846],[11,103],[169,-61],[15,118],[122,14],[10,70],[69,21],[21,152],[-45,42],[3,91],[205,-44],[22,-57],[-55,-108],[-11,-156],[-103,-34],[25,-216],[184,9],[59,-128],[87,-23],[18,112],[171,136],[20,95],[46,-43],[115,117],[-33,108],[23,59]],[[3282,8256],[22,43],[-74,67],[30,73],[79,-89],[87,112]],[[3426,8462],[47,-26],[-2,-182],[-169,-58],[-20,60]],[[3128,8017],[13,89]],[[3141,8106],[88,72]],[[3229,8178],[75,-103],[-18,-55],[-158,-3]],[[1996,6768],[-6,-1]],[[1990,6767],[-39,31],[73,68],[14,75],[165,222],[-32,212],[123,48],[28,143],[79,13],[36,85],[-27,86],[-84,58],[-35,-45],[-245,-54],[-1,103],[119,164],[2,139],[138,101],[-34,194],[85,60],[110,-81],[117,77],[73,-66],[89,17],[-68,-253],[122,-17],[43,-99],[83,73],[96,26]],[[3020,8147],[69,-125],[39,-5]],[[3128,8017],[135,-171]],[[5413,6643],[13,-92],[67,39],[7,-80],[64,62],[28,-131]],[[5592,6441],[-95,68],[-64,-60],[-68,-205],[89,21],[184,-219],[-12,-87],[-89,-40]],[[5537,5919],[2,65],[-90,40],[-4,-97],[-90,1],[-38,108],[-73,-154],[-35,53],[-119,-8],[-80,-125]],[[5010,5802],[-92,-8],[-81,-69],[32,-92],[-66,-87],[-53,-147],[-36,95],[-55,-81],[-9,-182],[-51,-115],[49,-144],[-35,-101]],[[6032,6758],[-25,-192],[-97,-160],[-56,9],[-99,-71],[-10,63],[-92,-17],[-61,51]],[[5410,7182],[26,-124],[42,10],[93,-85],[108,69],[112,-21],[71,-91],[19,-132],[151,-50]],[[6720,6807],[-95,33],[10,191],[-276,-49],[-73,62]],[[6286,7044],[-11,132],[294,71],[-5,138],[112,156],[-28,166],[-62,117]],[[6586,7824],[47,46],[55,228],[160,82],[-119,133],[7,83],[154,28],[18,-63],[115,10],[52,98],[90,-88],[125,-59],[78,12],[46,68],[-36,125],[-46,26],[82,53],[82,-59],[-45,-84],[84,-16],[49,-123],[55,108],[188,266]],[[7827,8698],[114,-38],[16,-249],[65,-147],[130,-47],[-6,-227],[49,-87],[-26,-102],[-85,-23],[-74,-224],[-133,-256],[-96,-451],[75,-390],[-13,-84],[-87,-106],[2,-71]],[[7258,5516],[-20,114],[23,282],[-62,190],[-92,-34],[-92,66],[96,95],[22,72],[-5,258],[-118,41],[-153,-8],[-137,215]],[[7465,7190],[87,-77],[123,84],[104,165],[39,320]],[[7818,7682],[13,236]],[[7831,7918],[103,12]],[[7934,7930],[61,66]],[[7995,7996],[11,78],[66,58]],[[8072,8132],[25,37],[-116,94],[-101,-43],[-174,-117],[-37,17],[-21,-138],[-121,2],[-149,-62],[-69,29],[-88,-28],[-52,-167],[-4,-115],[59,-36],[-48,-48],[29,-149],[-40,-83],[110,-66],[38,34],[97,-110],[55,7]],[[7760,8396],[0,0]],[[7497,8508],[0,0]],[[5445,8788],[151,68],[-62,15],[-23,92],[115,75],[16,83],[92,-47],[11,-126]],[[5745,8948],[-59,-61],[41,-173],[91,265]],[[5818,8979],[0,186],[72,55],[-49,77]],[[5841,9297],[42,115],[85,-30]],[[5968,9382],[16,-4]],[[5984,9378],[39,-179],[153,-31],[105,109],[49,-123],[-55,-198],[-124,106],[4,-149],[127,-47],[100,-112],[-52,-24],[29,-117],[127,-43],[-39,-248],[62,-133],[-12,-231],[87,-80],[2,-54]],[[6286,7044],[-148,-44],[-104,-76],[-29,-88],[27,-78]],[[3229,8178],[53,78]],[[3426,8462],[-16,60],[62,61],[-74,49],[127,141]],[[3525,8773],[0,-102],[68,-10],[19,-114],[87,208]],[[3699,8755],[75,-126],[99,18]],[[3020,8147],[121,-41]],[[8072,8132],[-131,-26],[54,-110]],[[7934,7930],[39,53],[-75,123],[-14,-107],[-53,-81]],[[7818,7682],[-81,-2],[-192,194],[-64,-12],[34,-124],[-48,-31],[-71,-136],[4,-174],[65,-207]],[[1111,5191],[10,195],[-71,191],[142,230],[17,-40],[249,128],[90,173],[135,132],[-61,70],[24,72],[88,59],[-7,82],[148,114],[115,170]],[[5410,4194],[22,-184],[-31,-153],[49,-213],[109,-80]],[[5354,3184],[-61,-22],[-151,-197],[65,-110],[-122,-205],[-60,-26],[-54,-156],[-109,-68],[-54,29],[-126,-206],[130,-173],[57,-249],[-22,-147],[-89,-89],[-17,-92],[-160,-54],[-28,-158],[21,-111],[-42,-81],[1,-95],[-53,-80],[-176,3],[-67,-119],[-32,-284],[-92,51],[-50,-48],[-113,119],[-30,-87],[-59,55],[4,68],[-91,130],[-179,-15],[-25,83],[-57,-7],[-25,-157],[-46,40],[-86,-51],[-8,-81],[-63,-25],[-141,-176],[-85,93],[-110,33],[-82,-167],[-62,18],[-118,-145],[-47,80],[-81,-99],[-160,316],[-22,171],[-55,83],[1,123],[-55,36],[-79,238],[-56,64],[-73,-110],[-33,25],[35,132],[-19,107],[36,142],[-185,29],[-38,38],[-14,133],[46,95],[-21,106],[135,383],[-88,163],[-88,105],[-29,142],[45,30],[64,301]],[[580,2480],[64,-53],[-23,-128],[62,-141],[58,75],[40,-94],[-36,-97],[-133,-92],[-105,-141],[5,-61],[-117,-127],[-97,54],[-87,-2],[-36,-74],[-116,27],[-57,-70],[84,276],[-70,70],[155,208],[65,37],[85,-40],[49,68],[-49,168],[53,164]],[[628,2639],[-19,-65]],[[5495,4754],[94,42],[-29,205],[62,160],[-76,49]],[[5546,5210],[16,136],[-46,83],[60,98],[38,-20],[90,68],[60,312]],[[5764,5887],[71,-17],[2,-175],[195,-25],[34,-148],[138,121],[46,-53],[77,23],[46,-225],[193,147]],[[6566,5535],[46,-224],[-186,-167],[12,-147]],[[5984,9378],[103,28]],[[6087,9406],[23,11]],[[6110,9417],[149,-87]],[[6259,9330],[46,12],[130,-114]],[[6435,9228],[42,-35],[106,43],[169,150],[176,-42],[129,-62],[29,-55],[190,18],[303,-191],[223,-347],[25,-9]],[[6720,6807],[-82,-183],[8,-166],[-50,-274],[-103,-58],[-19,-70],[106,-196],[9,-89],[55,-38],[-16,-165],[-62,-33]],[[5764,5887],[-62,-53],[-103,-16],[-69,40],[7,61]],[[5010,5802],[160,23],[20,-45],[-50,-176],[110,-22],[12,-72],[-33,-186],[10,-262],[-25,-27],[105,-164]],[[5377,4788],[52,90],[-99,135],[2,159],[83,111],[14,-82],[117,9]],[[3525,8773],[74,126],[67,-64],[58,101],[84,-130],[-109,-51]],[[5745,8948],[73,31]],[[6259,9330],[4,135],[-61,79],[80,101],[39,-136],[116,-72],[-59,-76],[57,-133]],[[6087,9406],[-35,123],[-79,-35],[-5,-112]],[[5841,9297],[-98,7],[-76,-50],[10,-70],[-163,31],[-114,111],[-3,118],[94,126],[6,75],[86,176],[141,57],[49,76],[85,7],[39,-215],[48,76],[-9,127],[69,-68],[27,-145],[48,47],[55,-63],[-62,-116],[56,-69],[-19,-118]]],"transform":{"scale":[0.0004536401461648932,0.00019904413907937473],"translate":[5.95608814594612,45.818234030032]}}

  module.exports = {
    // feature data - a collection of distinct entities
    featureData: function() { return this._featureData || (this._featureData = topojson.feature(rawTopo, rawTopo.objects.cantons)); },
    // mesh data - a single line that represents all Swiss borders
    meshData: function() { return this._meshData || (this._meshData = topojson.mesh(rawTopo, rawTopo.objects.cantons)); }
  };

});

/**
 * switzerlandBaseMap Map Component
 */
sszvis_namespace('sszvis.map.switzerlandBaseMap', function(module) {
  'use strict';

  module.exports = function() {
    var grundKarteRenderer = sszvis.map.renderer.grundkarte()
      .geoJson(sszvis.map.switzerlandMapData.meshData())
      .featureData(sszvis.map.switzerlandMapData.featureData())
      .mapPathCacheKey('switzerland');

    var component = d3.component()
      .delegate('width', grundKarteRenderer)
      .delegate('height', grundKarteRenderer)
      .delegate('borderColor', grundKarteRenderer)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        selection.call(grundKarteRenderer);
      });

    return component;
  };

});

/**
 * switzerland Map Component
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
sszvis_namespace('sszvis.map.switzerland', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('over', 'out', 'click');

    var base = sszvis.map.renderer.base()
      .geoJson(sszvis.map.switzerlandMapData.featureData());

    var mesh = sszvis.map.renderer.mesh()
      .geoJson(sszvis.map.switzerlandMapData.meshData());

    var highlight = sszvis.map.renderer.highlight()
      .geoJson(sszvis.map.switzerlandMapData.featureData());

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
        var mapPath = sszvis.map.utils.swissMapPath(props.width, props.height, sszvis.map.switzerlandMapData.featureData(), 'switzerland');

        // Base shape
        base
          .keyName(props.keyName)
          .mapPath(mapPath);

        // Border mesh
        mesh.mapPath(mapPath);

        // Highlight mesh
        highlight
          .keyName(props.keyName)
          .mapPath(mapPath);


        // Rendering

        selection.call(base)
                 .call(mesh)
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
