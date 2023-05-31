# dufour-peyton-intersection
Reference Implementation of the Dufour-Peyton Intersection Algorithm.  Calculates the Intersections of Arbitrary Polygons with a Geospatial Raster.  Originally developed for [geoblaze](geoblaze.io).

## features
- supports very large rasters because speed determined by number of geometry vertices
- avoids double counting pixels in overlapping polygons
- supports multi-polygons

## install
```bash
npm install dufour-peyton-intersection
```

## usage
```js
import dufour_peyton_intersection from "dufour-peyton-intersection";

const result = dufour_peyton_intersection.calculate({
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
});
```
calculate returns the following object:
```js
{
  rows: [
    <91 empty items>, // empty rows mean that the geometry does not intersect these raster rows 
    [ [ 500, 504 ] ], // 5 pixels (500 to 504) in row 92 (zero-index) intersect the geometry
    [ [ 491, 505 ] ],
    [ [ 490, 499 ], [ 501, 505 ] ], // two parts of the geometry intersect this row and are separated by 1 pixel at index 500
    [ [ 487, 506 ] ],
    ... 380 more items
  ]
}
```

## links
- https://medium.com/@DanielJDufour/calculating-intersection-of-polygon-with-a-raster-89c2624d78a2

## used by
- [geoblaze](https://geoblaze.io/): blazing fast raster statistics engine
- [geomask](https://github.com/danieljdufour/geomask): low-level geospatial masking functions
