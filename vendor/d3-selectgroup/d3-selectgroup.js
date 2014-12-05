(function(d3) {

  /**
   * d3.selection plugin to simplify creating idempotent groups that are not
   * recreated when rendered again.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @param  {String} key The name of the group
   * @return {d3.selection}
   */
  d3.selection.prototype.selectGroup = function(key) {

    // NOTE missing ';'
    var group = this.selectAll('[data-d3-selectgroup="' + key + '"]')
    // NOTE missing ';'
      .data(function(d){ return [d] })

    // NOTE missing ';'
    group.enter()
      .append('g')
      .attr('data-d3-selectgroup', key)

    return group;
  };

}(d3));
