# dufour-peyton-intersection
Reference Implementation of the Dufour-Peyton Intersection Algorithm.  Calculates the Intersections of Arbitrary Polygons with a Geospatial Raster.  Originally developed for [geoblaze](geoblaze.io).

# install
```bash
npm install dufour-peyton-intersection
```

# usage
```js
import dufour_peyton_intersection from "dufour-peyton-intersection";

dufour_peyton_intersection.calculate({
  // bounding box of raster in format [xmin, ymin, xmax, ymax]
  raster_bbox: [ 69.15892987765864, 1.4638624159537426, 90.43900703997244, 11.81870408668788],

  // height of the raster in pixels
  raster_height: 472,

  // width of the raster in pixels
  raster_width: 970,

  // height of each pixel in the spatial reference system
  // in the example below, height is in degrees
  pixel_height: 0.02193822387867402,

  // width of each pixel in the spatial reference system
  // in the example below, width is in degrees
  pixel_width: 0.02193822387867402,

  // a GeoJSON
  // currently, this algorithm only support the following geometry types: Polygon and MultiPolygon
  geometry: geojson,

  // callback function run on each horizontal strip of consecutive intersecting pixels
  per_row_segment: ({ row, columns }) => {
    console.log("row index is (starting from zero):", row);
    const [start, end] = columns;
    console.log(`columns range is inclusive, starting at column ${start} and ending at column ${end}`);
  },

  // callback function run on each raster pixel that intersects the geometry
  per_pixel: ({ row, column }) => {
    console.log("we found a raster pixel that intersects the geometry at");
    console.log("row (from top to bottom): " + row);
    console.log("column (from left to right): " + column)
  }
})
```
