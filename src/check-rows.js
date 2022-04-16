module.exports = function checkRanges(rows) {
  rows.forEach((ranges, irow) => {
    for (let irange = 0; irange < ranges.length; irange++) {
      const range = ranges[irange];
      const [start, end] = range;
      if (start > end) {
        console.warn("[dufour-peyton-intersection] uh oh, encountered invalid range", range, "at row index", irow, "with ranges", ranges);
      }

      for (let iother = irange + 1; iother < ranges.length; iother++) {
        if (iother[0] <= end) {
          console.warn("[dufour-peyton-intersection] encountered range problem on row index", irow, ":", ranges);
        }
      }
    }
  });
};
