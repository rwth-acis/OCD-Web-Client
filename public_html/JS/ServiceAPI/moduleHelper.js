/*
  Helper to use modules
 */

(function() {
  window.module = function(name, fn) {
    if (this[name] == null) {
      this[name] = {};
    }
    if (this[name].module == null) {
      this[name].module = window.module;
    }
    return fn.apply(this[name], []);
  };

}).call(this);

