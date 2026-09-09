const PATH = require("node:path");
const babel = require("@babel/core");
const prettier = require("prettier");

module.exports = function (eleventyConfig) {
  /**
   * The library bundle and its stylesheet are built by the `sszvis` package and
   * copied in here, so the docs output directory is no longer shared with the
   * library build. Turborepo guarantees `sszvis#build` has run first.
   *
   * sszvis.css belongs to the library, not to the docs: every consumer needs it
   * for tooltips, layer positioning and the fallback image. It used to live in
   * docs/ and only reached npm because the docs once built into the library's
   * build/ directory.
   */
  eleventyConfig.addPassthroughCopy({
    "../../packages/sszvis/build/sszvis.css": "sszvis.css",
    "../../packages/sszvis/build/sszvis.js": "sszvis.js",
    "../../packages/sszvis/build/sszvis.js.map": "sszvis.js.map",
    "../../packages/sszvis/build/sszvis.min.js": "sszvis.min.js",
    "../../packages/sszvis/build/sszvis.min.js.map": "sszvis.min.js.map",
  });

  /**
   * The TopoJSON bundles are built by @sszvis/geodata; they used to be committed
   * under docs/static/topo. Served at both paths: the examples load
   * ../static/topo/… and the guides document /topo/… as the public URL.
   */
  eleventyConfig.addPassthroughCopy({
    "../../packages/geodata/dist/topo": "static/topo",
  });
  // A glob, not the directory again: eleventy keys passthroughs by source path and
  // would silently drop a second entry with the same source.
  eleventyConfig.addPassthroughCopy({
    "../../packages/geodata/dist/topo/*.json": "topo",
  });

  /**
   * The Catalog homepage (docs/index.html) requires ProjectSpecimen.js; without
   * it Catalog.render throws and the whole index - nav and every README page -
   * fails to render. Built by @sszvis/project-specimen.
   */
  eleventyConfig.addPassthroughCopy({
    "../project-specimen/dist/ProjectSpecimen.js": "ProjectSpecimen.js",
  });

  eleventyConfig.addPassthroughCopy("docs/_headers");
  eleventyConfig.addPassthroughCopy("docs/index.html");
  eleventyConfig.addPassthroughCopy("docs/template.html");
  eleventyConfig.addPassthroughCopy("docs/**/*.css");
  eleventyConfig.addPassthroughCopy("docs/**/*.csv");
  eleventyConfig.addPassthroughCopy("docs/**/*.json");
  eleventyConfig.addPassthroughCopy("docs/**/*.md");
  eleventyConfig.addPassthroughCopy("docs/**/*.png");
  /**
   * Not familiar with eleventy, but it seems to not rewrite the whole build folder,
   * which lead to not having the js files in the build folder on the first build.
   */
  eleventyConfig.addPassthroughCopy("docs/**/*.js");

  eleventyConfig.addWatchTarget("docs/**/*.js");

  /**
   * printFileContents
   *
   * This shortcode is used to print the contents of a JavaScript file (or any
   * file, for that matter) into a template. It takes the content of what is
   * exported using "modules.export = …" and prints it verbatim.
   */
  eleventyConfig.addShortcode("printFileContents", function (relativePath) {
    const path = PATH.join(__dirname, PATH.dirname(this.page.inputPath), relativePath);
    const { code } = babel.transformFileSync(path, {
      sourceType: "script",
      generatorOpts: {
        compact: false,
        retainLines: true,
        shouldPrintComment: (val) => !/^\s*global\s/.test(val),
      },
    });
    return code;
  });

  eleventyConfig.addTransform("prettify", (content, outputPath) =>
    outputPath.endsWith(".html") ? prettier.format(content, { parser: "html" }) : content,
  );

  return {
    dir: {
      input: "docs",
      output: "dist",
    },
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk", "11ty.js"],
  };
};
