/**
 * @name overlaps
 * @description check if two ranges overlap
 * @param {Range} a 
 * @param {Range} b 
 * @returns {Boolean} result
 */
module.exports = function overlaps(a, b) {
  if (!Array.isArray(a)) throw new Error("[overlaps] a is not an array");
  if (!Array.isArray(b)) throw new Error("[overlaps] b is not an array");  
  return a[0] <= b[1] && b[0] <= a[1];
};
