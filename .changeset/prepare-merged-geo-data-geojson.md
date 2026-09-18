---
"sszvis": patch
---

report a missing `geoJson` by name in `sszvis.prepareMergedGeoData()` instead of an anonymous `TypeError` from reading its features. A missing `dataset` still yields an entry per feature with no datum, since that is a state a chart passes through before its data load
