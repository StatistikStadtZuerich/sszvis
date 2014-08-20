
function AppState(initialState, changeHandler) {
  this._changeHandler = changeHandler;
  this._state = initialState;
}

AppState.prototype.set = function(key, value) {
  this._state[key] = value;
  this._changeHandler(this._state);
}

AppState.prototype.get = function(key) {
  return this._state[key];
}


module.exports = AppState;
