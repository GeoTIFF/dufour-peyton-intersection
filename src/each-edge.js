module.exports = function eachEdge(polygon, callback) {
  polygon.forEach(ring => {
    for (let i = 1; i < ring.length; i++) {
      // should reuse previous endPoint as startPoint to save memory
      const startPoint = ring[i - 1];
      const endPoint = ring[i];
      const edgeIndex = i - 1;
      callback([startPoint, endPoint], edgeIndex);
    }
  });
};
