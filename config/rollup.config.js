import { join } from "path";
import uglify from "rollup-plugin-uglify";
import { version } from "../package.json";

const createConfig = ({ input, output, plugins }) => ({
  input,
  output,
  plugins,
  external: ["d3", "topojson"],
  globals: {
    d3: "d3",
    topojson: "topojson"
  },
  banner: `/*! sszvis v${version}, Copyright 2014-present Statistik Stadt Zürich */`
});

export default [
  createConfig({
    input: join(__dirname, "..", "src", "index.js"),
    output: [
      {
        file: join(__dirname, "..", "docs", "static", "sszvis.js"),
        format: "umd",
        name: "sszvis"
      }
    ]
  }),
  createConfig({
    input: join(__dirname, "..", "src", "index.js"),
    output: [
      {
        file: join(__dirname, "..", "docs", "static", "sszvis.min.js"),
        format: "umd",
        name: "sszvis"
      }
    ],
    plugins: [
      uglify({
        output: {
          comments: /^!/
        }
      })
    ]
  })
];
