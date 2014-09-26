namespace('sszvis.behavior.mouseover', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('mouseover').mouseover(sszvis.fn.identity)
      .prop('mouseout').mouseout(sszvis.fn.identity)
      .render(function() {
        var selection = d3.select(this),
            props = selection.props();

        selection
          .on('mouseover', props.mouseover)
          .on('mouseout', props.mouseout);
      });
  }

});
