import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest: { readonly exports: Readonly<Record<string, string>> } = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

/*
 * The exports map is the package's public surface, written out by hand. A module renamed
 * or moved under it would leave an entry that resolves to nothing, which no test inside
 * the package imports through, so only an app would find out.
 */
test.each(Object.entries(manifest.exports))("should point %s at a file", (_subpath, target) => {
  expect(fs.existsSync(path.join(root, target)), target).toBe(true);
});
