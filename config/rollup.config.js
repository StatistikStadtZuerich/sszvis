import { join } from "path";
import uglify from "rollup-plugin-uglify"

export default [{
  input: join(__dirname, "..", "src", "index.js"),
  output: [
    {
      file: join(__dirname, "..", "docs", "static", "sszvis.js"),
      format: "umd",
      name: "sszvis",
    }
  ],
  external: ["d3", "topojson"],
  globals: {
    d3: "d3",
    topojson: "topojson"
  }
},
{
  input: join(__dirname, "..", "src", "index.js"),
  output: [
    {
      file: join(__dirname, "..", "docs", "static", "sszvis.min.js"),
      format: "umd",
      name: "sszvis",
    }
  ],
  external: ["d3", "topojson"],
  globals: {
    d3: "d3",
    topojson: "topojson"
  },
  plugins: [
    uglify()
  ]
}
];
