import { rollup, hierarchy } from 'd3';
import { first, identity } from '../fn.js';

function prepareHierarchyData(data, options) {
  if (data !== undefined && options !== undefined) {
    const layout = createHierarchyLayout();
    options.layers.forEach(layer => {
      layout.layer(layer);
    });
    layout.value(options.valueAccessor);
    return layout.calculate(data);
  }
  // Otherwise, return the chained API
  return createHierarchyLayout();
}
function createHierarchyLayout() {
  const layers = [];
  let valueAcc = identity;
  let sortFn = (_a, _b) => 0;
  const api = {
    calculate: data => {
      if (layers.length === 0) {
        throw new Error("At least one layer must be specified before calculating hierarchy data");
      }
      const nested = unwrapNested(rollup(data, first, ...layers));
      const rootData = {
        _tag: "root",
        children: nested
      };
      return hierarchy(rootData, d => {
        return d._tag === "leaf" ? undefined : d.children;
      }).sort(sortFn).sum(node => {
        return node._tag === "leaf" ? valueAcc(node.data) : 0;
      });
    },
    layer: keyFunc => {
      layers.push(keyFunc);
      return api;
    },
    value: accfn => {
      valueAcc = accfn;
      return api;
    },
    sort: sortFunc => {
      sortFn = sortFunc;
      return api;
    }
  };
  return api;
} // Helper function to safely unwrap nested rollup data
/**
 * Helper function to safely unwrap nested rollup data.
 * Handles uneven tree structures where some branches terminate earlier than others.
 * When a layer accessor returns null, the node will use its parent's key as a fallback
 * to ensure labels remain functional.
 *
 * @param roll - The nested Map structure from d3.rollup()
 * @param parentKey - The key of the parent node (used as fallback for null keys)
 * @param rootKey - The top-level category key (used for color mapping)
 * @returns Array of NodeDatum objects representing the hierarchy
 */
function unwrapNested(roll) {
  let parentKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  let rootKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  const rollupMap = roll;
  return Array.from(rollupMap, _ref => {
    var _ref2;
    let [key, values] = _ref;
    // Use parent key as fallback when current key is null/undefined
    const effectiveKey = (_ref2 = key !== null && key !== void 0 ? key : parentKey) !== null && _ref2 !== void 0 ? _ref2 : "";
    // For root category, use the current key if we're at the first level (rootKey is null)
    const effectiveRootKey = rootKey !== null && rootKey !== void 0 ? rootKey : effectiveKey;
    if (values instanceof Map && values.size > 0) {
      // Branch node - has children
      return {
        _tag: "branch",
        key: effectiveKey,
        rootKey: effectiveRootKey,
        children: unwrapNested(values, effectiveKey, effectiveRootKey)
      };
    } else {
      // Leaf node - has data
      return {
        _tag: "leaf",
        key: effectiveKey,
        rootKey: effectiveRootKey,
        data: values
      };
    }
  });
}
/** The fill used when a node carries no key the colour scale can be looked up with. */
const HIERARCHY_FALLBACK_COLOR = "#cccccc";
/**
 * The colour key a hierarchy node inherits: its own rootKey when the layout wrote one,
 * otherwise the key of its top-level ancestor (the child of the root). Leaves and branches
 * of one category therefore share a colour even when only the root was tagged.
 *
 * Returns undefined when neither is available; callers decide whether to fall back to the
 * node's own key.
 */
function inheritedColorKey(node) {
  if ("rootKey" in node.data && node.data.rootKey) return node.data.rootKey;
  const ancestors = node.ancestors();
  const topLevel = ancestors.find((_, i) => {
    var _ancestors;
    return i < ancestors.length - 1 && ((_ancestors = ancestors[i + 1]) === null || _ancestors === void 0 ? void 0 : _ancestors.data._tag) === "root";
  });
  if (topLevel && "key" in topLevel.data) return topLevel.data.key;
  return undefined;
}
/** `inheritedColorKey`, falling back to the node's own key. */
function colorKeyOf(node) {
  const inherited = inheritedColorKey(node);
  if (inherited !== undefined) return inherited;
  return "key" in node.data ? node.data.key : undefined;
}
/** The fill a hierarchy node is drawn with, or the grey fallback when it has no key. */
function nodeColor(node, colorScale) {
  const key = colorKeyOf(node);
  return key === undefined ? HIERARCHY_FALLBACK_COLOR : colorScale(key);
}

export { HIERARCHY_FALLBACK_COLOR, colorKeyOf, inheritedColorKey, nodeColor, prepareHierarchyData, unwrapNested };
//# sourceMappingURL=hierarchy.js.map
