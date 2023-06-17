/**
 * @name mergeConsecutive
 * @description merges integer ranges if they touch.  ranges that are within 1 of each other count as consecutive and touching
 * @param {Array<Range>} ranges 
 * @returns {Array<Range>} ranges
 */
module.exports = function mergeConsecutive(ranges) {
  const numberOfRanges = ranges.length;

  if (numberOfRanges === 0) return [];

  const firstRange = ranges[0];
  let previousEnd = firstRange[1];
  const result = [firstRange];
  for (let i = 1; i < numberOfRanges; i++) {
    const tempRange = ranges[i];
    const [start, end] = tempRange;
    if (start <= previousEnd + 1) {
      result[result.length - 1][1] = Math.max(previousEnd, end);
    } else {
      result.push(tempRange);
    }
    previousEnd = end;
  }
  return result;
};
