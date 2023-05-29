/**
 * @name roundDown
 * @description like Math.round, but numbers in the middle are rounded down not up
 * @param {Number} n
 * @returns {Number} rounded number
 */
module.exports = function roundDown(n) {
  return -1 * Math.round(-1 * n);
};
