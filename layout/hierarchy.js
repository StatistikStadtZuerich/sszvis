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
function unwrapNested(roll) {
  const rollupMap = roll;
  return Array.from(rollupMap, _ref => {
    let [key, values] = _ref;
    if (values instanceof Map && values.size > 0) {
      // Branch node - has children
      return {
        _tag: "branch",
        key,
        children: unwrapNested(values)
      };
    } else {
      // Leaf node - has data
      return {
        _tag: "leaf",
        key,
        data: values
      };
    }
  });
}

export { prepareHierarchyData, unwrapNested };
//# sourceMappingURL=hierarchy.js.map
