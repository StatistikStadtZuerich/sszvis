;(function() {

  d3.selection.prototype.selectGroup = function(key) {
    var group = this.selectAll('[data-d3-selectgroup="' + key + '"]')
      .data(function(d){ return [d] })

    group.enter()
      .append('g')
      .attr('data-d3-selectgroup', key)

    return group;
  };

}());
