const categorizeIntersection = require("./categorize-intersection.js");
const clamp = require("./clamp.js");
const cluster = require("./cluster.js");
const clusterLineSegments = require("./cluster-line-segments.js");
const calculate = require("./calculate.js");
const couple = require("./couple.js");
const getBoundingBox = require("./get-bounding-box.js");
const getPolygons = require("./get-polygons.js");
const eachEdge = require("./each-edge.js");
const getIntersectionOfTwoLines = require("./get-intersection-of-two-lines.js");
const getLineFromPoints = require("./get-line-from-points.js");
const mergeRanges = require("./merge-ranges.js");
const partition = require("./partition.js");

const dufour_peyton_intersection = {
  calculate,
  categorizeIntersection,
  clamp,
  cluster,
  clusterLineSegments,
  couple,
  eachEdge,
  getBoundingBox,
  getIntersectionOfTwoLines,
  getLineFromPoints,
  getPolygons,
  mergeRanges,
  partition
};

if (typeof define === "function" && define.amd) define(() => dufour_peyton_intersection);
if (typeof module === "object") module.exports = dufour_peyton_intersection;
if (typeof self == "object") self.dufour_peyton_intersection = dufour_peyton_intersection;
if (typeof window == "object") window.dufour_peyton_intersection = dufour_peyton_intersection;
