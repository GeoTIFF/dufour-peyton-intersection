module.exports = function validate (range) {
  if (range === undefined) throw new Error("range is undefined");
  if (range === null) throw new Error("range is null");
  if (typeof range === 'number') throw new Error("range is a number, but should be an array of numbers");
  if (!Array.isArray(range)) throw new Error("range should be an array");
  if (range.length !== 2) throw new Error("range should have a length of 2 [start, end], but instead had a length of " + range.length);
  if (!range.every(n => typeof n === "number")) throw new Error("range values were not all numbers");
}