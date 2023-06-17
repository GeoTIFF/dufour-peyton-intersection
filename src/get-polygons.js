const eachPolygon = require("./each-polygon.js");

module.exports = function getPolygons(geojson) {
  const polygons = [];
  eachPolygon(geojson, polygon => polygons.push(polygon));
  return polygons;
};
