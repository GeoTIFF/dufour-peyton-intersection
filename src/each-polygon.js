const getDepth = require("get-depth");

// call callback function for each polygon in geojson
module.exports = function eachPolygon(geojson, callback) {
  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach(feature => eachPolygon(feature, callback));
  } else if (geojson.type === "Feature") {
    eachPolygon(geojson.geometry, callback);
  } else if (geojson.type === "Polygon") {
    eachPolygon(geojson.coordinates, callback);
  } else if (geojson.type === "MultiPolygon") {
    geojson.coordinates.forEach(polygon => {
      callback(polygon);
    });
  } else if (Array.isArray(geojson)) {
    const depth = getDepth(geojson);
    if (depth === 4) {
      geojson.forEach(polygon => {
        callback(polygon);
      });
    } else if (depth === 3) {
      callback(geojson);
    }
  }
};
