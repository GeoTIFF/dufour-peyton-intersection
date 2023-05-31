const getLineFromPoints = require("./get-line-from-points.js");
const categorizeIntersection = require("./categorize-intersection.js");
const clamp = require("./clamp.js");
const couple = require("./couple.js");
const clusterLineSegments = require("./cluster-line-segments.js");
const getEdges = require("./get-edges.js");
const getIntersectionOfTwoLines = require("./get-intersection-of-two-lines.js");
const getPolygons = require("./get-polygons.js");
const mergeRanges = require("./merge-ranges.js");
const partition = require("./partition.js");
const prepareSnap = require("./prepare-snap.js");
const range = require("./range.js");

module.exports = function calculateCore({
  debug_level = 0,
  raster_bbox,
  raster_height, // number of rows of pixels in the raster
  raster_width, // number of columns of pixels in the raster
  pixel_height,
  pixel_width,
  geometry,
  per_pixel,
  per_row_segment
}) {
  const [raster_xmin, raster_ymin, raster_xmax, raster_ymax] = raster_bbox;

  // iterate through image rows and convert each one to a line
  // running through the middle of the row
  const imageLines = [];

  if (raster_height === 0) return;

  for (let y = 0; y < raster_height; y++) {
    const lat = raster_ymax - pixel_height * y - pixel_height / 2;

    // use that point, plus another point along the same latitude to
    // create a line
    const point0 = [raster_xmin, lat];
    const point1 = [raster_xmin + 1, lat];
    const line = getLineFromPoints(point0, point1);
    imageLines.push(line);
  }
  if (debug_level >= 2) console.log("[dufour-peyton-intersection] imageLines:", imageLines);

  // collapse geometry down to a list of edges
  // necessary for multi-part geometries
  const polygons = getPolygons(geometry);
  const polygonEdges = polygons.map(getEdges);

  polygonEdges.forEach(edges => {
    // iterate through the list of polygon vertices, convert them to
    // lines, and compute the intersections with each image row
    const intersectionsByRow = range(raster_height).map(() => []);
    const numberOfEdges = edges.length;
    for (let i = 0; i < numberOfEdges; i++) {
      // get vertices that make up an edge and convert that to a line
      const edge = edges[i];

      const [startPoint, endPoint] = edge;
      const [x1, y1] = startPoint;
      const [x2, y2] = endPoint;

      const direction = Math.sign(y2 - y1);
      const horizontal = y1 === y2;
      const vertical = x1 === x2;

      const edgeY = y1;

      const edgeLine = getLineFromPoints(startPoint, endPoint);

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
        const imageLine = imageLines[j];

        if (imageLine === undefined) {
          console.error("j:", j);
          console.error("imageLines:", imageLines);
          throw Error("imageLines");
        }

        // because you know x is zero in ax + by = c, so by = c and b = -1, so -1 * y = c or y = -1 * c
        const imageLineY = -1 * imageLine.c;

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
            xminOnLine = xmaxOnLine = getIntersectionOfTwoLines(edgeLine, imageLine).x;
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
            index: i,
            edge,
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
    }

    const half_pixel_width = pixel_width / 2;
    const snap = prepareSnap(raster_xmin, pixel_width);

    intersectionsByRow.forEach((segmentsInRow, row_index) => {
      if (segmentsInRow.length > 0) {
        const clusters = clusterLineSegments(segmentsInRow, numberOfEdges);
        const categorized = clusters.map(categorizeIntersection);
        const [throughs, nonthroughs] = partition(categorized, item => item.through);

        if (throughs.length % 2 === 1) {
          if (debug_level >= 1) console.error("throughs:", JSON.stringify(throughs));
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
  });
};
