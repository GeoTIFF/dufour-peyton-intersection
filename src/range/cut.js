const rangeOverlap = require("./overlaps.js");

module.exports = function cut(range, hole) {
  if (!Array.isArray(range)) throw new Error("[cut] range is not an array: " + JSON.stringify(range));

  if (hole === undefined) return [range];

  if (!Array.isArray(hole)) throw new Error("[cut] hole is not an array:" + JSON.stringify(hole));  

  if (!rangeOverlap(range, hole)) return [range];

  const result = [];

  // check if left-side extends past hole
  if (range[0] < hole[0]) result.push([range[0], hole[0] - 1]);

  // check if right-side extends past hole
  if (range[1] > hole[1]) result.push([hole[1] + 1, range[1]]);

  return result;
};
