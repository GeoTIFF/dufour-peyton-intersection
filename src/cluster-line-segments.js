"use strict";

const cluster = require("./cluster.js");

module.exports = function clusterLineSegments(lineSegments, numberOfEdges, debug = false) {
  try {
    const clusters = cluster(lineSegments, s => s.endsOffLine);

    const numberOfClusters = clusters.length;

    if (numberOfClusters >= 2) {
      const firstCluster = clusters[0];
      const firstSegment = firstCluster[0];
      const lastCluster = clusters[clusters.length - 1];
      const lastSegment = lastCluster[lastCluster.length - 1];

      // determine if the last segment should be added to the first
      if (lastSegment.last_edge_in_ring && firstSegment.index === 0 && lastSegment.endsOnLine) {
        clusters[0] = clusters.pop().concat(firstCluster);
      }
    }

    return clusters;
  } catch (error) {
    console.error("[clusterLineSegments]", error);
  }
};
