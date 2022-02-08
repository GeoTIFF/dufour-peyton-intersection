const eachEdge = require("./each-edge.js");

module.exports = function getEdges(polygon) {
  const edges = [];
  eachEdge(polygon, edge => edges.push(edge));
  return edges;
};
