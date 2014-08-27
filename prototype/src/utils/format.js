var d3 = require('d3');

module.exports = {
  number: function(d) {
    if (d >= 1e4) {
      return d3.format(',.2r')(d);
    } else if (d === 0) {
      return 0;
    } else {
      return d3.format('.2r')(d);
    }
  }
}
