"use strict";

/**
 * @name partition
 * @description break items into two groups based on
 * whether they pass or fail a provided filter function
 * @param {Array} array
 * @param {Function} filter function
 * @returns {Array} partitioned items - [array_passed, array_unpassed]
 */
module.exports = function partition(array, filter) {
  const passed = [];
  const unpassed = [];
  const len = array.length;
  for (let i = 0; i < len; i++) {
    const item = array[i];
    if (filter(item)) passed.push(item);
    else unpassed.push(item);
  }
  return [passed, unpassed];
};
