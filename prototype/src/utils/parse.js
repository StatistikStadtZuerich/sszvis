module.exports = {
  date: function(d) {
    return d3.time.format("%d.%m.%Y").parse(d);
  },
  number: function(d) {
    return (d.trim() === '') ? NaN : +d;
  }
}
