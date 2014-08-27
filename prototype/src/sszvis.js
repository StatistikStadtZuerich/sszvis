// Assets
require('./sszvis.scss');

// D3 setup
var d3 = require('d3');
         require('./lib/d3-bounds');
         require('./lib/d3-component');
         require('./lib/d3-selectgroup');

var localizedFormat = d3.locale(require('../locales/de.json'));
d3.format = localizedFormat.numberFormat
d3.time.format = localizedFormat.timeFormat

// Public API
sszvis = {
  d3: d3,
  createChart: require('./utils/createChart'),

  axis: {
    time: require('./axis/time')
  },
  chart: {
    line: require('./chart/line')
  },
  component: {
    line: require('./component/line')
  },
  utils: {
    parse: require('./utils/parse'),
    translate: require('./utils/translate')
  },

  // Experimental
  error: function(msg) { alert(msg); }, // Do something smart here
  store: require('./core/store'),
  actions: require('./core/dispatcher')
}

module.exports = sszvis;
