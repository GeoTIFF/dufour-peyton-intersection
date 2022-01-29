module.exports = function categorizeIntersection(segments) {
  try {
    let through, xmin, xmax;

    const n = segments.length;

    const first = segments[0];

    if (n === 1) {
      through = true;
      xmin = first.xmin;
      xmax = first.xmax;
    } /* n > 1 */ else {
      const last = segments[n - 1];
      through = first.direction === last.direction;
      xmin = Math.min(first.xmin, last.xmin);
      xmax = Math.max(first.xmax, last.xmax);
    }

    if (xmin === undefined || xmax === undefined || through === undefined || isNaN(xmin) || isNaN(xmax)) {
      throw Error("categorizeIntersection failed with xmin", xmin, "and xmax", xmax);
    }

    return { xmin, xmax, through };
  } catch (error) {
    console.error("[categorizeIntersection] segments:", segments);
    console.error("[categorizeIntersection]", error);
    throw error;
  }
};
