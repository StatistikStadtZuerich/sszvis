var fs = require('fs');

var imgb64 = 'data:image/png;base64,' + fs.readFileSync(process.argv[2]).toString('base64');

var program = [
  "sszvis_namespace('sszvis.map.data." + process.argv[3] + "', function(module) {",
  "\t'use strict';",
  "\tmodule.exports = '" + imgb64 + "';",
  "});",
  ""
].join('\n');

process.stdout.write(program);
