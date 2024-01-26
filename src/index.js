"use strict";

const categorizeIntersection = require("./categorize-intersection.js");
const clamp = require("./clamp.js");
const cluster = require("./cluster.js");
const clusterLineSegments = require("./cluster-line-segments.js");
const calculate = require("./calculate.js");
const calculateCore = require("./calculate-core.js");
const couple = require("./couple.js");
const eachPair = require("./each-pair.js");
const eachPolygon = require("./each-polygon.js");
const mergeRanges = require("./range/merge.js");
const mergeConsecutiveRanges = require("./range/merge-consecutive.js");
const partition = require("./partition.js");
const prepareSnap = require("./prepare-snap.js");
const rangeContains = require("./range/contains.js");
const rangeCut = require("./range/cut.js");
const carveHoles = require("./range/multicut.js");
const rangeOverlap = require("./range/overlaps.js");
const roundDown = require("./round-down.js");
const rangeSort = require("./range/sort.js");

const dufour_peyton_intersection = {
  calculate,
  calculateCore,
  carveHoles,
  categorizeIntersection,
  clamp,
  cluster,
  clusterLineSegments,
  couple,
  eachPair,
  eachPolygon,
  mergeRanges,
  mergeConsecutiveRanges,
  partition,
  prepareSnap,
  rangeContains,
  rangeCut,
  rangeOverlap,
  rangeSort,
  roundDown
};

if (typeof define === "function" && define.amd) define(() => dufour_peyton_intersection);
if (typeof module === "object") module.exports = dufour_peyton_intersection;
if (typeof self == "object") self.dufour_peyton_intersection = dufour_peyton_intersection;
if (typeof window == "object") window.dufour_peyton_intersection = dufour_peyton_intersection;
