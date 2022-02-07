module.exports = function cluster(items, newClusterTest) {
  try {
    const numberOfItems = items.length;
    const clusters = [];
    let cluster = [];
    for (let i = 0; i < numberOfItems; i++) {
      const item = items[i];
      cluster.push(item);
      if (newClusterTest(item)) {
        clusters.push(cluster);
        cluster = [];
      }
    }

    if (cluster.length > 0) clusters.push(cluster);

    return clusters;
  } catch (error) {
    console.error("[cluster]:", error);
  }
};
