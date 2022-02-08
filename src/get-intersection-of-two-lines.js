// function to get the point at which two lines intersect
// the input uses the line representations from the
// getLineFromPoints function
module.exports = function getIntersectionOfTwoLines(line1, line2) {
  // calculate the determinant, ad - cb in a square matrix |a b|
  const det = line1.a * line2.b - line2.a * line1.b; /*  |c d| */

  if (det) {
    // this makes sure the lines aren't parallel, if they are, det will equal 0
    const x = (line2.b * line1.c - line1.b * line2.c) / det;
    const y = (line1.a * line2.c - line2.a * line1.c) / det;
    return { x, y };
  }
};
