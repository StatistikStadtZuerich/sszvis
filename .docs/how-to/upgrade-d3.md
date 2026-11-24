# How to upgrade d3

A d3 upgrade is not a routine dependency bump. The d3 version is part of what the
consumer agreed to and had reviewed. It changes on the consumer's request or as part
of a planned major release. See
[How consumers load sszvis](../explanation/how-consumers-load-sszvis.md).

1. Agree the target version with the consumer before you change anything.
2. In `packages/sszvis/package.json`, raise the `d3` range in `peerDependencies` and
   the version in `devDependencies`.
3. Run the unit tests, the snapshot suite and the
   [consumer chart check](check-consumer-charts.md).
4. Write a changeset that names the required d3 version. A d3 major is an sszvis
   major.
5. Update the d3 range in [supported environments](../reference/supported-environments.md).
