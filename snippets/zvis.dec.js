var chart = zvis.chart({
  // height/width, innerHeight/innerWidth? (padding)
  width: 890,
  height: 500,
  margin: {top: 20, right: 20, bottom: 30, left: 50},
  layers: [

    // -> What's the interface here?
    // d3node.call(layer)
    // but where do the attrs come from?

    // d3.svg.axis().scale(x).orient('bottom')

    // // A layer has a `key` prop
    // zvis.layer()
    //   .attr('class', 'x axis')
    //   .attr('transform', function(c) {
    //     return 'translate(0,' + height + ')'
    //   })
    //   .call(d3.svg.axis().scale(x).orient('bottom'))

    // zvis.layer({
    //   className: 'x axis',
    //   transform: 'translate(0,' + height + ')'
    // }, d3.svg.axis().scale(x).orient('bottom'))

    // {
    //   attr: {
    //     className: 'x axis',
    //     transform: 'translate(0,' + height + ')'
    //   },
    //   style: {
    //     background: '#faa'
    //   }
    // }

    // function(chart){
    //   svg.append("g")
    //       .attr("class", "x axis")
    //       .attr("transform", "translate(0," + chart.height + ")")
    //       .call(d3.svg.axis().scale(x).orient('bottom'));
    // }


    // function(render, chart) {
    //   render({
    //     className: 'x axis',
    //     'translate(0,' + chart.height + ')'
    //   }, d3.svg.axis().scale(x).orient('bottom'))
    // }
    // {
    //   className: 'x axis',
    //   transform: function(chart) { return 'translate(0,' + chart.height + ')' },
    //   render: d3.svg.axis()
    //     .scale(x)
    //     .orient("bottom")
    // }
  ]
});






// layouts -> HTML or d3?
// zvis.layout.default()
//   .title("Beispiellayout")
//   .content(chart)
//   .legend()
