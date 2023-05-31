const roundDown = require("./round-down.js");

/**
 * @name prepareSnap
 * @description snap horizontal range in crs to model space
 * @private
 * @param {Number} raster_xmin
 * @param {Number} pixel_width
 * @return {([Number, Number]) => [Number, Number]}
 */
module.exports = function prepareSnap(raster_xmin, pixel_width) {
  return ([xmin, xmax]) => {
    // use roundDown so 1.5 is rounded to 1 not 2
    xmin = roundDown((xmin - raster_xmin) / pixel_width);
    if (xmin === -0) xmin = 0;

    xmax = Math.round((xmax - raster_xmin) / pixel_width);
    if (xmax === -0) xmax = 0;

    return [xmin, xmax];
  };
};
