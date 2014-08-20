StandardLayout({
    title: "My lib",
    subtitle: "Blabla",
    layers: [
        ChartA({}),
        AxisB({})
    ]
})


var WrapSVG = React.createClass({
  componentDidMount: function() {
    var node = d3.select(this.getDOMNode());
    this.props.children.forEach(function(child) {
      node.append(child)
    });
  },
  render: function() {
    return React.DOM.g(null)
  }
});
