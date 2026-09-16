import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import mdxMermaid from "mdx-mermaid";
import path from "node:path";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCodePlugin from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";
import { catalogDark, catalogLight } from "./app/lib/shiki-catalog-theme.ts";
import remarkTocExport from "./app/lib/remark-toc-export.ts";
import { examplesPlugin } from "./vite-plugin-examples.ts";

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkGfm, mdxMermaid, remarkTocExport],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: { className: ["subheading-anchor"], ariaLabel: "Link to section" },
          },
        ],
        [
          rehypePrettyCodePlugin,
          {
            theme: { dark: catalogDark, light: catalogLight },
            defaultColor: false,
            keepBackground: false,
            transformers: [
              transformerNotationDiff(),
              transformerNotationHighlight(),
              transformerNotationFocus(),
            ],
          },
        ],
      ],
    }),
    examplesPlugin(),
    tailwindcss(),
    reactRouter(),
  ],
  /*
   * mdx-mermaid pulls mermaid in via a dynamic import, so Vite only discovers it
   * once a page with a diagram is requested and then re-optimizes mid-session -
   * which serves the first such page a 504 and leaves the diagram unrendered
   * until a manual reload. Pre-bundling it at startup avoids that.
   */
  optimizeDeps: { include: ["mermaid"] },
  resolve: { alias: { "~": path.resolve(import.meta.dirname, "app") } },
});
