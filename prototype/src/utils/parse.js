var d3 = require('d3');

module.exports = {
  date: function(d) {
    return d3.time.format("%d.%m.%Y").parse(d);
  },
  number: function(d) {
    return (d.trim() === '') ? NaN : +d;
  }
}
