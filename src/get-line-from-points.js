// function to convert two points into a
// representation of a line
module.exports = function getLineFromPoints(startPoint, endPoint) {
  // get a, b, and c from line equation ax + by = c
  const [x1, y1] = startPoint;
  const [x2, y2] = endPoint;
  const a = y2 - y1;
  const b = x1 - x2;
  const c = a * x1 + b * y1;

  // return just a b and c since that is all we need
  // to compute the intersection
  return { a, b, c };
};
