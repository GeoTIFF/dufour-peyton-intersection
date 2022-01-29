const getDepth = require("get-depth");

const add = require("preciso/add.js");
const divide = require("preciso/divide.js");
const multiply = require("preciso/multiply.js");
const remainder = require("preciso/remainder.js");
const subtract = require("preciso/subtract.js");

const categorizeIntersection = require("./categorize-intersection.js");
const clamp = require("./clamp.js");
const clusterLineSegments = require("./cluster-line-segments.js");
const couple = require("./couple.js");
const getIntersectionOfTwoLines = require("./get-intersection-of-two-lines.js");
const getLineFromPoints = require("./get-line-from-points.js");
const getBoundingBox = require("./get-bounding-box.js");
const mergeRanges = require("./merge-ranges.js");
const partition = require("./partition.js");

/*
  don't need
  - noDataValue
  - values/imageBands


  // assumes same SRS
*/

// I don't think this supports polygons with holes
const getEdgesForPolygon = polygon => {
  const edges = [];
  polygon.forEach(ring => {
    for (let i = 1; i < ring.length; i++) {
      const startPoint = ring[i - 1];
      const endPoint = ring[i];
      edges.push([startPoint, endPoint]);
    }
  });
  return edges;
};

module.exports = function calculateIntersections({
  precise = true, // whether to use infinitely precise or floating-point arithmetic
  raster_bbox, // compute pixel width and height from this
  raster_height, // height of the raster in pixels
  raster_width, // width of the raster in pixels
  vector, // vector geometry
  vector_bbox,
  callback
}) {
  if (raster_height === 0) return;

  const raster_height_string = raster_height.toString();
  const raster_width_string = raster_width.toString();

  // convert bbox to strings
  raster_bbox = raster_bbox.map(n => n.toString());
  const [raster_xmin, raster_ymin, raster_xmax, raster_ymax] = raster_bbox;

  const cell_height = divide(subtract(raster_ymax, raster_ymin), raster_height_string);
  const half_cell_height = divide(cell_height, "2");
  const half_cell_height_number = Number(half_cell_height);

  const cell_width = divide(subtract(raster_xmax, raster_xmin), raster_width_string);
  const half_cell_width = divide(cell_width, "2");
  const half_cell_width_number = Number(half_cell_width);

  const index_of_last_row = raster_height - 1;

  // get values in a bounding box around the geometry
  vector_bbox ??= getBoundingBox(vector);

  // set origin points of bbox of geometry in image space
  const y0str = add(vector_bbox.ymax.toString(), remainder(subtract(raster_ymax, vector_bbox.ymax.toString()), cell_height));
  const y0 = Number(y0str);
  const x0str = subtract(vector_bbox.xmin.toString(), remainder(subtract(vector_bbox.xmin.toString(), raster_xmin), cell_width));
  const x0 = Number(x0str);

  // iterate through image rows and convert each one to a line
  // running through the middle of the row
  const image_lines = [];

  for (let y = 0; y < raster_height; y++) {
    let lat;
    if (precise) {
      lat = Number(subtract(subtract(y0str, multiply(cell_height, y.toString())), half_cell_height));
    } else {
      lat = y0 - cell_height * y - cell_height / 2;
    }

    // use that point, plus another point along the same latitude to
    // create a line
    const point0 = [x0, lat];
    const point1 = [x0 + 1, lat];
    const line = getLineFromPoints(point0, point1);
    image_lines.push(line);
  }

  // collapse geometry down to a list of edges
  // necessary for multi-part geometries
  const depth = getDepth(vector);
  const polygonEdges = depth === 4 ? vector.map(getEdgesForPolygon) : [getEdgesForPolygon(vector)];

  const intersections = new Array(raster_height);

  polygonEdges.forEach(edges => {
    // iterate through the list of polygon vertices, convert them to
    // lines, and compute the intersections with each image row
    const intersectionsByRow = [];
    for (let i = 0; i < raster_height; i++) intersectionsByRow.push([]);
    
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

      let startX, startY, endY, endX;
      if (x1 < x2) {
        [startX, startY] = startPoint;
        [endX, endY] = endPoint;
      } else {
        [startX, startY] = endPoint;
        [endX, endY] = startPoint;
      }

      if (startX === undefined) throw Error("startX is " + startX);

      // find the y values in the image coordinate space
      const imageY1 = Math.round((y0 - half_cell_height_number - startY) / cell_height);
      const imageY2 = Math.round((y0 - half_cell_height_number - endY) / cell_height);

      // make sure to set the start and end points so that we are
      // incrementing upwards through rows
      let row_start, row_end;
      if (imageY1 < imageY2) {
        row_start = imageY1;
        row_end = imageY2;
      } else {
        row_start = imageY2;
        row_end = imageY1;
      }

      row_start = clamp(row_start, 0, index_of_last_row);
      row_end = clamp(row_end, 0, index_of_last_row);

      // iterate through image lines within the change in y of
      // the edge line and find all intersections
      for (let j = row_start; j < row_end + 1; j++) {
        const imageLine = image_lines[j];

        if (imageLine === undefined) {
          console.error("j:", j);
          console.error("image_lines:", image_lines);
          throw Error("image_lines");
        }

        // because you know x is zero in ax + by = c, so by = c and b = -1, so -1 * y = c or y = -1 * c
        const imageLineY = -1 * imageLine.c;
        //if (j === row_start) console.log("imageLineY:", imageLineY);

        const startsOnLine = y1 === imageLineY;
        const endsOnLine = y2 === imageLineY;
        const endsOffLine = !endsOnLine;

        let xminOnLine, xmaxOnLine;
        if (horizontal) {
          if (edgeY === imageLineY) {
            xminOnLine = startX;
            xmaxOnLine = endX;
          } else {
            continue; // stop running calculations for this horizontal line because it doesn't intersect at all
          }
        } else if (vertical) {
          /* we have to have a separate section for vertical bc of floating point arithmetic probs with get_inter..." */
          if (imageLineY >= edgeYMin && imageLineY <= edgeYMax) {
            xminOnLine = startX;
            xmaxOnLine = endX;
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
        if (xminOnLine && xmaxOnLine && (horizontal || (xminOnLine >= startX && xmaxOnLine <= endX && imageLineY <= edgeYMax && imageLineY >= edgeYMin))) {
          //let image_pixel_index = Math.floor((intersection.x - x0) / cellWidth);
          //intersectionsByRow[j].push(image_pixel_index);
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

    intersectionsByRow.map((segmentsInRow, rowIndex) => {
      if (segmentsInRow.length > 0) {
        const clusters = clusterLineSegments(segmentsInRow, numberOfEdges);
        const categorized = clusters.map(categorizeIntersection);
        const [throughs, nonthroughs] = partition(categorized, item => item.through);

        if (throughs.length % 2 === 1) {
          throw Error("throughs.length for " + rowIndex + " is odd with " + throughs.length);
        }

        let insides = nonthroughs.map(intersection => [intersection.xmin, intersection.xmax]);

        // sorts throughs from left to right in-place
        throughs.sort((a, b) => a.xmin - b.xmin);

        const couples = couple(throughs).map(([left, right]) => [left.xmin, right.xmax]);

        insides = insides.concat(couples);

        /*
          This makes sure we don't double count pixels.
          For example, converts `[[0,10],[10,10]]` to `[[0,10]]`
        */
        insides = mergeRanges(insides);

        insides.forEach(([xmin, xmax]) => {
          // convert left and right to image pixels
          const left = Math.round((xmin - (x0 + half_cell_width_number)) / cell_width);
          const right = Math.round((xmax - (x0 + half_cell_width_number)) / cell_width);

          const startColumnIndex = Math.max(left, 0);
          const endColumnIndex = Math.min(right, raster_width);

          callback({
            row: rowIndex,
            columns: [startColumnIndex, endColumnIndex]
          });
        });
      }
    });
  });

  return {
    vector_bbox
  };
};
