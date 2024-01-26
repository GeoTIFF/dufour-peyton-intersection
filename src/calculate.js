"use strict";
const getPolygons = require("./get-polygons.js");
const mergeConsecutiveRanges = require("./range/merge-consecutive.js");
const rangeSort = require("./range/sort.js");
const calculatePolygon = require("./calculate-polygon.js");

module.exports = function calculate({ geometry, raster_height, per_pixel, per_row_segment, debug_level = 0, ...rest }) {
  const polys = getPolygons(geometry);

  // collect inside segments by row for each polygons
  const inside_rows_by_polygon = polys.map(polygon =>
    calculatePolygon({
      polygon,
      raster_height,
      debug_level,
      ...rest
    })
  );
  if (debug_level >= 1) console.log("[dufour-peyton-intersection] inside_rows_by_polygon:", inside_rows_by_polygon);

  const results = new Array(raster_height);
  for (let i = 0; i < raster_height; i++) {
    const insides = inside_rows_by_polygon
      .map(polygon_rows => polygon_rows[i])
      .filter(it => it !== undefined && it.length > 0)
      .flat();
    if (insides.length > 0) {
      const sorted = rangeSort(insides);
      const merged = mergeConsecutiveRanges(sorted);
      results[i] = merged;
    }
  }

  if (per_row_segment || per_pixel) {
    results.forEach((row_segments, row_index) => {
      if (row_segments) {
        row_segments.forEach((seg, iseg) => {
          if (per_row_segment) {
            per_row_segment({ row: row_index, columns: seg });
          }

          if (per_pixel) {
            const [start_column_index, end_column_index] = seg;
            for (let column_index = start_column_index; column_index <= end_column_index; column_index++) {
              per_pixel({ row: row_index, column: column_index });
            }
          }
        });
      }
    });
  }

  return { rows: results };
};
