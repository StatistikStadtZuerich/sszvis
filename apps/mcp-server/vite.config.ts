import { defineConfig } from "vite";

/*
 * The server is built with vite rather than esbuild because @sszvis/chart-builder loads its
 * templates with `import.meta.glob`. Everything is bundled, since pnpm gives this app no
 * access to chart-builder's own dependencies at run time - except ts-blank-space, whose
 * TypeScript compiler is CommonJS that breaks once inlined into ESM. It is a dependency
 * here instead.
 */
export default defineConfig({
  build: {
    ssr: "src/index.ts",
    outDir: "dist",
    emptyOutDir: false,
    target: "node22",
    rollupOptions: { output: { entryFileNames: "index.js" } },
  },
  ssr: { noExternal: true, external: ["ts-blank-space"], target: "node" },
});
