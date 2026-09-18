---
"sszvis": patch
---

make `sszvis.stackedBarVerticalData()`'s and `sszvis.stackedBarVerticalLayout()`'s series `index` agree with the array it is returned in. The vertical layout stacks in reverse, so d3 numbered each series by its stacking position while returning the array in key order — a caller reading `index` to drive a legend got the stack the wrong way up, while the horizontal layout's already agreed. The array order is unchanged, so nothing about the rendering moves
