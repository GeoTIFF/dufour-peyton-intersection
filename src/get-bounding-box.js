module.exports = function getBoundingBox(geometry) {
  let xmin, ymin, xmax, ymax;

  if (typeof geometry[0][0] === "number") {
    const numberOfPoints = geometry.length;
    xmin = xmax = geometry[0][0];
    ymin = ymax = geometry[0][1];
    for (let i = 1; i < numberOfPoints; i++) {
      const [x, y] = geometry[i];
      if (x < xmin) xmin = x;
      else if (x > xmax) xmax = x;
      if (y < ymin) ymin = y;
      else if (y > ymax) ymax = y;
    }
  } else {
    geometry.forEach((part, index) => {
      const bbox = getBoundingBox(part);
      if (index == 0) {
        xmin = bbox.xmin;
        xmax = bbox.xmax;
        ymin = bbox.ymin;
        ymax = bbox.ymax;
      } else {
        if (bbox.xmin < xmin) xmin = bbox.xmin;
        else if (bbox.xmax > xmax) xmax = bbox.xmax;
        if (bbox.ymin < ymin) ymin = bbox.ymin;
        else if (bbox.ymax > ymax) ymax = bbox.ymax;
      }
    });
  }

  return { xmax, xmin, ymax, ymin };
}