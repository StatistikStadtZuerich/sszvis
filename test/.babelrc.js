module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],
  plugins: [
    // This is needed for Jest to run, it can't work with ES modules in node_modules otherwise.
    // But: this mustn't be used outside of testing, as Rollup needs proper ES modules.
    "@babel/plugin-transform-modules-commonjs",
  ],
};
