module.exports = {
  number: function(d) {
    return (d.trim() === '') ? NaN : +d;
  }
}
