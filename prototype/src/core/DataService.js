var _ = require('underscore');
var Promise = require('es6-promise').Promise;

function DataService(config) {
  this._request = new Promise(function(resolve, reject) {
    d3[config.format](config.url, function(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(parseData(config.schema, data));
      }
    });
  });
}

DataService.prototype.then = function(handler) {
  this._request.then(handler);
  return this;
}

DataService.prototype.catch = function(handler) {
  this._request.catch(handler);
  return this;
}

module.exports = DataService;


// Helpers
function parseData(schema, data) {
  return data.map(function(d) {
    return schema.reduce(function(acc, def) {
      acc[def.as || def.key] = def.format(d[def.key]);
      return acc;
    }, {});
  });
}
