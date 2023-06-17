const compare = require("./compare.js");

/**
 * @name sort
 * @description sorts the given ranges and returns them.  this mutates the original input.
 * @param {Array<Range>} ranges
 * @returns {Array<Range>} sorted ranges
 */
module.exports = function sort(ranges) {
  return ranges.sort(compare);
};
