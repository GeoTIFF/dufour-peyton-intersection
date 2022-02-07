const eachPolygon = require("./each-polygon.js");

module.exports = function getBoundingBox(geometry) {
  let xmin, ymin, xmax, ymax;

  eachPolygon(geometry, polygon => {
    const ring = polygon[0]; // only want the exterior ring
    const imax = ring.length - 1;

    let i;
    if (xmin === undefined) {
      xmin = xmax = ring[0][0];
      ymin = ymax = ring[0][1];
      i = 1;
    } else {
      i = 0;
    }

    for (; i <= imax; i++) {
      const [x, y] = ring[i];
      if (x < xmin) xmin = x;
      else if (x > xmax) xmax = x;
      if (y < ymin) ymin = y;
      else if (y > ymax) ymax = y;
    }
  });

  return [xmin, ymin, xmax, ymax];
};
