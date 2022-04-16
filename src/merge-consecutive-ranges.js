module.exports = function mergeConsecutiveRanges(ranges) {
  const numberOfRanges = ranges.length;
  if (numberOfRanges > 0) {
    const firstRange = ranges[0];
    let previousEnd = firstRange[1];
    const result = [firstRange];
    for (let i = 1; i < numberOfRanges; i++) {
      const tempRange = ranges[i];
      const [start, end] = tempRange;
      if (start <= previousEnd + 1) {
        result[result.length - 1][1] = end;
      } else {
        result.push(tempRange);
      }
      previousEnd = end;
    }
    return result;
  }
};
