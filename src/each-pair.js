"use strict";

module.exports = function eachPair(arr, callback) {
  for (let i = 1; i < arr.length; i++) {
    const a = arr[i - 1];
    const b = arr[i];
    callback([a, b], i - 1);
  }
};
