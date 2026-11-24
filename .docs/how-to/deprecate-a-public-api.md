# How to deprecate a public API

There is no formal deprecation policy. This guide records how deprecations have been
done so far. The aim is to keep old charts working until the next major release. For
the reasoning, see [decisions.md](../decisions.md#semver-and-backwards-compatibility).

1. Keep the old API working, usually as an alias of the new one or a thin wrapper
   around it.
2. Mark it with a JSDoc `@deprecated` tag that names the version and the
   replacement:

   ```ts
   /**
    * @deprecated since v3.4.0 - use sszvis.prepareHierarchyData instead
    */
   ```

   Check that the replacement you name exists on the `sszvis` global. Some older
   `@deprecated` tags name paths that do not.

   To see the existing deprecations, run `rg '@deprecated' packages/sszvis/src`.

3. Write the deprecation into the changeset. When you curate the release, put it
   under `### Deprecated` in the changelog and `## Deprecated` in the release notes.
   The 3.4.0 entry for `groupedBars` and `groupedBarsVertical` is the example.
4. Migrate the consumer charts that use the old API to the new one, upstream.
5. Remove the old API in the next major release. Never remove it in a minor or a
   patch.
