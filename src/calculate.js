const calculateCallbacks = require("./calculate-core.js");
const checkRows = require("./check-rows.js");
const mergeConsecutiveRanges = require("./merge-consecutive-ranges.js");

module.exports = function calculate({
  debug = false,
  raster_bbox,
  raster_height,
  raster_width,
  pixel_height,
  pixel_width,
  geometry,
  per_pixel,
  per_row_segment
}) {
  const [xmin, ymin, xmax, ymax] = raster_bbox;
  if (pixel_height === undefined || pixel_height === null) pixel_height = (ymax - ymin) / raster_height;
  if (pixel_width === undefined || pixel_width === null) pixel_width = (xmax - xmin) / raster_width;

  const rows = new Array(raster_height);

  calculateCallbacks({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    geometry,
    per_pixel,
    per_row_segment: ({ row, columns }) => {
      if (!rows[row]) rows[row] = [];
      rows[row].push(columns);
      if (per_row_segment) per_row_segment({ row, columns });
    }
  });

  for (let irow = 0; irow < rows.length; irow++) {
    const ranges = rows[irow];
    if (ranges) {
      // sort from left to right
      ranges.sort((a, b) => (a === b ? a[1] - b[1] : a[0] - b[0]));

      // replace existing row with sorted and merged one
      rows[irow] = mergeConsecutiveRanges(ranges);
    }
  }

  if (debug) checkRows(insides);

  return { rows };
};
