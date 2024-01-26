"use strict";
const carveHoles = require("./range/multicut.js");
const calculateRing = require("./calculate-ring");

module.exports = function calculatePolygon({ polygon, ...options }) {
  const { debug_level = 0 } = options;
  const [exterior, ...holes] = polygon.map(ring => calculateRing({ ring, ...options }));
  if (debug_level >= 2) console.log("[dufour-peyton-intersection] exterior:", exterior);

  // for each row inside the polygon
  // collect the relevant holes and then carve them out of that row
  const result = exterior.map((row_insides, irow) => {
    const row_holes = holes.map(hole_rows => hole_rows[irow]).flat();
    return carveHoles(row_insides, row_holes);
  });

  return result;
};
