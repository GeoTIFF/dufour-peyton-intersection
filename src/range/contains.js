/**
 * @name contains
 * @description check if the first range contains the second range
 * @param {Range} a 
 * @param {Range} b 
 * @returns {Boolean} result
 */
module.exports = function contains (a, b) {
  return b[0] >= a[0] && b[1] <= a[1];
}
