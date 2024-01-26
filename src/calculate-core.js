"use strict";
const categorizeIntersection = require("./categorize-intersection.js");
const clamp = require("./clamp.js");
const couple = require("./couple.js");
const clusterLineSegments = require("./cluster-line-segments.js");
const eachPair = require("./each-pair.js");
const mergeRanges = require("./range/merge.js");
const partition = require("./partition.js");
const prepareSnap = require("./prepare-snap.js");

module.exports = function calculateCore({
  debug_level = 0,
  raster_bbox,
  raster_height, // number of rows of pixels in the raster
  raster_width, // number of columns of pixels in the raster
  pixel_height,
  pixel_width,
  ring, // array of points
  per_pixel,
  per_row_segment
}) {
  const [raster_xmin, raster_ymin, raster_xmax, raster_ymax] = raster_bbox;

  // iterate through the list of polygon vertices, convert them to
  // lines, and compute the intersections with each image row
  const intersectionsByRow = [];
  for (let i = 0; i < raster_height; i++) intersectionsByRow.push([]);

  eachPair(ring, (edge, iedge) => {
    const [startPoint, endPoint] = edge;
    const [x1, y1] = startPoint;
    const [x2, y2] = endPoint;

    const direction = Math.sign(y2 - y1);
    const horizontal = y1 === y2;
    const vertical = x1 === x2;
    const slope = (y2 - y1) / (x2 - x1);

    const edgeY = y1;

    const edgeYMin = Math.min(y1, y2);
    const edgeYMax = Math.max(y1, y2);

    let startLng, startLat, endLat, endLng;
    if (x1 < x2) {
      [startLng, startLat] = startPoint;
      [endLng, endLat] = endPoint;
    } else {
      [startLng, startLat] = endPoint;
      [endLng, endLat] = startPoint;
    }

    if (startLng === undefined) throw Error("startLng is " + startLng);

    // find the y values in the image coordinate space
    const imageY1 = Math.round((raster_bbox[3] - 0.5 * pixel_height - startLat) / pixel_height);
    const imageY2 = Math.round((raster_bbox[3] - 0.5 * pixel_height - endLat) / pixel_height);

    // make sure to set the start and end points so that we are
    // incrementing upwards through rows
    let rowStart, rowEnd;
    if (imageY1 < imageY2) {
      rowStart = imageY1;
      rowEnd = imageY2;
    } else {
      rowStart = imageY2;
      rowEnd = imageY1;
    }

    rowStart = clamp(rowStart, 0, raster_height - 1);
    rowEnd = clamp(rowEnd, 0, raster_height - 1);
    // iterate through image lines within the change in y of
    // the edge line and find all intersections
    for (let j = rowStart; j < rowEnd + 1; j++) {
      const imageLineY = raster_ymax - pixel_height * j - pixel_height / 2;

      const startsOnLine = y1 === imageLineY;
      const endsOnLine = y2 === imageLineY;
      const endsOffLine = !endsOnLine;

      let xminOnLine, xmaxOnLine;
      if (horizontal) {
        if (edgeY === imageLineY) {
          xminOnLine = startLng;
          xmaxOnLine = endLng;
        } else {
          continue; // stop running calculations for this horizontal line because it doesn't intersect at all
        }
      } else if (vertical) {
        /* we have to have a seprate section for vertical because of floating point arithmetic probs with get_inter..." */
        if (imageLineY >= edgeYMin && imageLineY <= edgeYMax) {
          xminOnLine = startLng;
          xmaxOnLine = endLng;
        }
      } else if (startsOnLine) {
        // we know that the other end is not on the line because then it would be horizontal
        xminOnLine = xmaxOnLine = x1;
      } else if (endsOnLine) {
        // we know that the other end is not on the line because then it would be horizontal
        xminOnLine = xmaxOnLine = x2;
      } else {
        try {
          xminOnLine = xmaxOnLine = x1 + (imageLineY - y1) / slope;
        } catch (error) {
          throw error;
        }
      }

      // check to see if the intersection point is within the range of
      // the edge line segment. If it is, add the intersection to the
      // list of intersections at the corresponding index for that row
      // in intersectionsByRow
      if (
        xminOnLine !== undefined &&
        xmaxOnLine !== undefined &&
        (horizontal || (xminOnLine >= startLng && xmaxOnLine <= endLng && imageLineY <= edgeYMax && imageLineY >= edgeYMin))
      ) {
        intersectionsByRow[j].push({
          direction,
          index: iedge,
          edge,
          // e.g: if there are 5 points (last repeated), there are 4 edges, with the last index being 3 (zero-indexed)
          last_edge_in_ring: iedge === ring.length - 2,
          endsOnLine,
          endsOffLine,
          horizontal,
          startsOnLine,
          vertical,
          xmin: xminOnLine,
          xmax: xmaxOnLine,
          imageLineY
        });
      }
    }
  });

  const half_pixel_width = pixel_width / 2;
  const snap = prepareSnap(raster_xmin, pixel_width);

  if (debug_level >= 1) console.log("[dufour-peyton-intersection] intersectionsByRow:", intersectionsByRow);

  intersectionsByRow.forEach((segmentsInRow, row_index) => {
    if (segmentsInRow.length > 0) {
      const clusters = clusterLineSegments(segmentsInRow);
      const categorized = clusters.map(categorizeIntersection);
      const [throughs, nonthroughs] = partition(categorized, item => item.through);

      if (throughs.length % 2 === 1) {
        if (debug_level >= 1) console.error("[dufour-peyton-intersection] throughs:", JSON.stringify(throughs));
        throw Error("throughs.length for " + row_index + " is odd with " + throughs.length);
      }

      let insides = nonthroughs.map(intersection => [intersection.xmin, intersection.xmax]);

      // sorts throughs from left to right in-place
      throughs.sort((a, b) => a.xmin - b.xmin);

      const couples = couple(throughs).map(couple => {
        const [left, right] = couple;
        return [left.xmin, right.xmax];
      });

      insides = insides.concat(couples);

      /*
        This makes sure we don't double count pixels.
        For example, converts `[[0,10],[10,10]]` to `[[0,10]]`
      */
      insides = mergeRanges(insides);

      insides.forEach(pair => {
        const [xmin, xmax] = pair;

        if (xmax - xmin < half_pixel_width) return;

        // snap [xmin, xmax] in srs to raster coordinates
        const [left, right] = snap(pair);

        // intersection doesn't take up more than half of a pixel
        if (left === right) return;

        // skip because segment is beyond the right edge of the raster
        if (left > raster_width) return;

        // skip because segment is beyond the left edge of the raster
        if (right <= 0) return;

        const start_column_index = Math.max(left, 0);
        const end_column_index = Math.min(right - 1, raster_width - 1);

        if (per_row_segment) {
          per_row_segment({
            row: row_index,
            columns: [start_column_index, end_column_index]
          });
        }

        if (per_pixel) {
          for (let column_index = start_column_index; column_index <= end_column_index; column_index++) {
            per_pixel({ row: row_index, column: column_index });
          }
        }
      });
    }
  });
};
