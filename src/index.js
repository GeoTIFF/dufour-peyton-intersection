const categorizeIntersection = require("./categorize-intersection.js");
const clamp = require("./clamp.js");
const cluster = require("./cluster.js");
const clusterLineSegments = require("./cluster-line-segments.js");
const calculate = require("./calculate.js");
const calculateCore = require("./calculate-core.js");
const couple = require("./couple.js");
const getBoundingBox = require("./get-bounding-box.js");
const eachPair = require("./each-pair.js");
const eachPolygon = require("./each-polygon.js");
const mergeRanges = require("./merge-ranges.js");
const partition = require("./partition.js");
const prepareSnap = require("./prepare-snap.js");
const range = require("./range.js");
const roundDown = require("./round-down.js");

const dufour_peyton_intersection = {
  calculate,
  calculateCore,
  categorizeIntersection,
  clamp,
  cluster,
  clusterLineSegments,
  couple,
  eachPair,
  eachPolygon,
  getBoundingBox,
  mergeRanges,
  partition,
  prepareSnap,
  range,
  roundDown
};

if (typeof define === "function" && define.amd) define(() => dufour_peyton_intersection);
if (typeof module === "object") module.exports = dufour_peyton_intersection;
if (typeof self == "object") self.dufour_peyton_intersection = dufour_peyton_intersection;
if (typeof window == "object") window.dufour_peyton_intersection = dufour_peyton_intersection;
