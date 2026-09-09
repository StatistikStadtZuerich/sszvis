var PATH = require("path");

/**
 * webpack 4 hashes with md4, which OpenSSL 3 removed, so it needs the legacy
 * provider on modern Node. Set here rather than in the npm script so it cannot
 * leak into the rest of the build.
 */
const crypto = require("node:crypto");
const origCreateHash = crypto.createHash;
crypto.createHash = (algorithm, ...rest) =>
  origCreateHash(algorithm === "md4" ? "sha256" : algorithm, ...rest);

module.exports = {
  mode: "production",
  entry: "./src/Project.js",
  output: {
    // Consumed by apps/docs through an eleventy passthrough copy.
    path: PATH.resolve(__dirname, "dist"),
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
