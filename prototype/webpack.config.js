var path = require('path');

module.exports = {
  entry: path.join(__dirname, 'src', 'zvis.js'),
  output: {
    path: path.join(__dirname, "assets"),
    publicPath: 'assets/',
    filename: 'zvis.js',
    libraryTarget: 'var',
    library: 'zvis'
  },
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: "style!css!sass?outputStyle=compressed&includePaths[]=" +
          (path.resolve(__dirname, '../node_modules'))
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.json'],
    alias: {
      'd3': path.resolve(__dirname, 'node_modules/d3/d3.js'), // Use the browser, not the node (jsDOM) version
      'underscore': 'lodash'
    }
  }
};
