/**
 * @name compare
 * @description compare two ranges, sorting from left to right (smaller to larger) by left edge, then right edge
 * @param {Range} a 
 * @param {Range} b 
 * @returns {Number} comparison, which can be -1, 1, or zero
 */
module.exports = function compare (a, b) {
  return Math.sign(a[0] - b[0]) || Math.sign(a[1] - b[1]);
}
