import { join } from "path";

export default {
  entry: join(__dirname, "..", "src", "index.js"),
  targets: [
    {
      dest: join(__dirname, "..", "dist", ".js"),
      format: "umd",
      moduleName: "sszvis"
    }
  ],
  external: ["d3", "topojson"],
  globals: {
    d3: "d3",
    topojson: "topojson"
  }
};
