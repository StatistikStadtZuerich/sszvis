import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import { contentPages } from "../content-pages";
import { CHANGELOG_URL, LEGACY_PATHS } from "./legacy-paths";

const here = path.dirname(fileURLToPath(import.meta.url));

const catalog = fs.readFileSync(path.join(here, "../../../docs/docs/index.html"), "utf8");
const oldSlugs = [...catalog.matchAll(/\{\s*path:\s*"([^"]+)",\s*title:\s*"[^"]*",\s*src:/g)]
  .map((match) => match[1])
  .filter((slug) => slug !== "/");

const routes = new Set(contentPages.map((page) => page.routePath));

test("should read the previous site's page list", () => {
  expect(oldSlugs.length).toBeGreaterThan(30);
});

test.each(oldSlugs)("should send #/%s to a page that exists", (slug) => {
  const target = LEGACY_PATHS[slug] ?? slug;
  expect(target === CHANGELOG_URL || routes.has(target), `${slug} -> ${target}`).toBe(true);
});
