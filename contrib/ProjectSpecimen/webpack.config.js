var PATH = require("path");

module.exports = {
  mode: "production",
  entry: "./src/Project.js",
  output: {
    path: PATH.resolve(__dirname, "../../build"),
    filename: "ProjectSpecimen.js",
    library: "ProjectSpecimen",
    libraryTarget: "var",
    libraryExport: "default",
  },
  externals: {
    catalog: "Catalog",
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
};
