"use strict";
const calculateCore = require("./calculate-core.js");
const checkRows = require("./check-rows.js");
const mergeConsecutiveRanges = require("./range/merge-consecutive.js");
const rangeSort = require("./range/sort.js");

module.exports = function calculateRing({ debug_level = 0, raster_bbox, raster_height, raster_width, pixel_height, pixel_width, ring }) {
  const [xmin, ymin, xmax, ymax] = raster_bbox;

  if (raster_bbox.every(it => typeof it === "string")) {
    throw new Error("[dufour-peyton-intersection] raster_bbox should be all numbers, not strings");
  }

  if (pixel_height === undefined || pixel_height === null) pixel_height = (ymax - ymin) / raster_height;
  if (pixel_width === undefined || pixel_width === null) pixel_width = (xmax - xmin) / raster_width;

  const rows = [];
  for (let i = 0; i < raster_height; i++) rows.push([]);

  calculateCore({
    debug_level,
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    ring,
    per_row_segment: ({ row, columns }) => {
      rows[row].push(columns);
    }
  });

  for (let irow = 0; irow < rows.length; irow++) {
    const ranges = rows[irow];
    if (ranges) {
      // sort from left to right
      rangeSort(ranges);

      // replace existing row with sorted and merged one
      rows[irow] = mergeConsecutiveRanges(ranges);
    }
  }

  if (debug_level >= 2) checkRows(rows);

  return rows;
};
