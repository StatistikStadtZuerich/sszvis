module.exports = function(fileInfo, api, options) {
  return api.jscodeshift(fileInfo.source)
    .find(api.jscodeshift.Program)
    .replaceWith(path => {
      // console.log(path.value);
      const body = [].concat.apply([], path.value.body.map(node => {
        if (node.type === 'ExpressionStatement') {
          const exp = node.expression;

          if (exp.type === 'CallExpression') {
            const callee = exp.callee;
            if (callee.name == 'sszvis_namespace') {
              const body = exp.arguments[1].body.body;

              body[0].comments = [].concat.call(
                [],
                node.comments || [],
                body[0].comments || []
              );

              return body;
            }
          }
        }

        return [node];
      }));

      path.value.body = body;

      return path.value;
    })
    .toSource();
};
