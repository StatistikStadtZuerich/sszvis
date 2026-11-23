import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest: { readonly exports: Readonly<Record<string, string>> } = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

/* Nothing in the package imports through its exports map, so a stale entry would only surface in an app. */
test.each(Object.entries(manifest.exports))("should point %s at a file", (_subpath, target) => {
  expect(fs.existsSync(path.join(root, target)), target).toBe(true);
});
