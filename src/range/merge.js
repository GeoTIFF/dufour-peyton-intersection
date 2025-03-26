// This function takes in an array of number pairs and combines where there's overlap
module.exports = function mergeRanges(ranges) {
  const numberOfRanges = ranges.length;

  if (numberOfRanges > 0) {
    // Sort ranges by start, and if equal, by end
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    const result = [];
    let [currentStart, currentEnd] = ranges[0];

    for (let i = 1; i < numberOfRanges; i++) {
      const [start, end] = ranges[i];

      // If the current range overlaps or is contiguous with the previous one
      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end); // Extend the range
      } else {
        // Push the current range to the result and start a new one
        result.push([currentStart, currentEnd]);
        currentStart = start;
        currentEnd = end;
      }
    }

    // Push the last range
    result.push([currentStart, currentEnd]);

    return result;
  }
};
