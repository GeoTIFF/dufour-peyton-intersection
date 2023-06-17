const fs = require("fs");

const test = require("flug");

const findAndRead = require("find-and-read");
const getPreciseBoundingBox = require("geotiff-precise-bbox");
const from = require("geotiff-from");
const reprojectGeoJSON = require("reproject-geojson");
const count = require("fast-counter");
const writePng = require("@danieljdufour/write-png");
const { clip, update } = require("xdim");

const getPolygons = it => {
  const polygons = [];
  eachPolygon(it, polygon => polygons.push(polygon));
  return polygons;
};

const get_most_common = arr => {
  const entries = Object.entries(count(arr, { depth: 1 }));
  const total = entries.reduce((acc, it) => acc + it[1], 0);
  entries.forEach(it => it.push(it[1] / total));
  return entries.sort((a, b) => Math.sign(b[1] - a[1]))[0];
};

const writeImage = (filename, data, [width, height]) => {
  writePng(`./test-output/${filename}`, data, { width, height });
};

const {
  calculateCore,
  calculate,
  categorizeIntersection,
  couple,
  clamp,
  cluster,
  clusterLineSegments,
  eachPair,
  eachPolygon,
  getBoundingBox,
  mergeRanges,
  partition,
  prepareSnap,
  range,
  roundDown
} = require("./src/index.js");

test("eachPair", ({ eq }) => {
  const coords = [
    [78, 10],
    [78, 5],
    [82, 5],
    [82, 10],
    [78, 10]
  ];
  const actual = [];
  eachPair(coords, (pair, ipair) => actual.push([ipair, pair]));
  eq(actual, [
    [
      0,
      [
        [78, 10],
        [78, 5]
      ]
    ],
    [
      1,
      [
        [78, 5],
        [82, 5]
      ]
    ],
    [
      2,
      [
        [82, 5],
        [82, 10]
      ]
    ],
    [
      3,
      [
        [82, 10],
        [78, 10]
      ]
    ]
  ]);
});

test("roundDown", ({ eq }) => {
  eq(roundDown(0), 0);
  eq(roundDown(-0.5), -1);
  eq(roundDown(-10.49), -10);
  eq(roundDown(1.234), 1);
  eq(roundDown(1.5), 1);
});

test("prepareSnap", ({ eq }) => {
  const snap = prepareSnap(0, 5);
  eq(snap([-4.5, 5]), [-1, 1]);
  eq(snap([-2.5, 5]), [-1, 1]);
  eq(snap([-1, 5]), [0, 1]);
  eq(snap([0, 5]), [0, 1]);
  eq(snap([0, 2]), [0, 0]); // takes up less than 50% of pixel width
  eq(snap([0, 2.5]), [0, 1]);
  eq(snap([1.5, 2.5]), [0, 1]);
  eq(snap([13, 20]), [3, 4]);
  eq(snap([15, 20]), [3, 4]);
});

test("partition", ({ eq }) => {
  const nums = [0, 1, 2, 3];
  const [even, odd] = partition(nums, n => n % 2 === 0);
  eq(even, [0, 2]);
  eq(odd, [1, 3]);
});

test("categorization of intersections", ({ eq }) => {
  // through
  let segments = [{ xmin: -140, xmax: -140, direction: 1 }];
  let actual = categorizeIntersection(segments);
  eq(actual.through, true);
  eq(actual.xmin, -140);
  eq(actual.xmax, -140);

  // rebound
  segments = [
    { xmin: -140, xmax: -140, direction: 1 },
    { xmin: -140, xmax: -140, direction: -1 }
  ];
  actual = categorizeIntersection(segments);
  eq(actual.through, false);
  eq(actual.xmin, -140);
  eq(actual.xmax, -140);

  // horizontal through
  segments = [
    { xmin: -140, xmax: -140, direction: 1 },
    { xmin: -140, xmax: -130, direction: 0 },
    { xmin: -130, xmax: -130, direction: 1 }
  ];
  actual = categorizeIntersection(segments);
  eq(actual.through, true);
  eq(actual.xmin, -140);
  eq(actual.xmax, -130);

  // horizontal rebound
  segments = [
    { xmin: -140, xmax: -140, direction: 1 },
    { xmin: -140, xmax: -130, direction: 0 },
    { xmin: -130, xmax: -130, direction: -1 }
  ];
  actual = categorizeIntersection(segments);
  eq(actual.through, false);
  eq(actual.xmin, -140);
  eq(actual.xmax, -130);

  // through with stop
  segments = [
    { xmin: -140, xmax: -140, direction: 1 },
    { xmin: -140, xmax: -140, direction: 1 }
  ];
  actual = categorizeIntersection(segments);
  eq(actual.through, true);
  eq(actual.xmin, -140);
  eq(actual.xmax, -140);
});

test("clustering", ({ eq }) => {
  let segments, computed, computedNumberOfClusters;

  segments = [{ endsOffLine: true }, { endsOffLine: false }, { endsOffLine: false }, { endsOffLine: true }];
  computed = cluster(segments, s => s.endsOffLine);
  computedNumberOfClusters = computed.length;
  eq(computedNumberOfClusters, 2);
  eq(computed[0].length, 1);
  eq(computed[1].length, 3);

  segments = [{ endsOffLine: true, index: 0 }, { endsOffLine: false }, { endsOffLine: false }, { endsOffLine: false, index: 99 }];
  computed = cluster(segments, s => s.endsOffLine);
  computedNumberOfClusters = computed.length;
  eq(computedNumberOfClusters, 2);
  eq(computed[0].length, 1);
  eq(computed[1].length, 3);
});

test("clustering of line segments", ({ eq }) => {
  const segments = [
    { endsOffLine: true, index: 0 },
    { endsOffLine: false },
    { endsOffLine: false },
    { endsOffLine: false, endsOnLine: true, last_edge_in_ring: true, index: 99 }
  ];
  const computed = clusterLineSegments(segments, true);
  computedNumberOfClusters = computed.length;
  eq(computedNumberOfClusters, 1);
  eq(computed[0].length, 4);
});

test("coupling", ({ eq }) => {
  const items = [0, 1, 18, 77, 99, 103];
  const actual = couple(items);
  eq(actual.length, items.length / 2);
  actual.map(couple => {
    eq(couple.length, 2);
  });
});

test("clamping", ({ eq }) => {
  eq(clamp(10, 1, 11), 10);
  eq(clamp(-10, 1, 11), 1);
  eq(clamp(990, 1, 11), 11);
});

test("merging of index ranges", ({ eq }) => {
  let original = [
    [0, 10],
    [10, 10],
    [20, 30],
    [30, 40]
  ];
  let merged = mergeRanges(original);
  eq(JSON.stringify(merged), "[[0,10],[20,40]]");

  original = [
    [0, 10],
    [10, 10],
    [21, 31],
    [30, 40]
  ];
  merged = mergeRanges(original);
  eq(JSON.stringify(merged), "[[0,10],[21,40]]");
});

test("Get Bounding Box of GeoJSON that has MultiPolygon Geometry (i.e., multiple rings)", async ({ eq }) => {
  const str = fs.readFileSync("./data/Akrotiri-and-Dhekelia.geojson", "utf-8");
  const country = JSON.parse(str);
  const bbox = getBoundingBox(country.geometry.coordinates);
  eq(bbox, [32.76010131835966, 34.56208419799816, 33.92147445678711, 35.118995666503906]);
});

test("get polygons for Akrotiri and Dhekelia", async ({ eq }) => {
  const geojson = JSON.parse(findAndRead("Akrotiri-and-Dhekelia.geojson", { encoding: "utf-8" }));
  const polygons = getPolygons(geojson);
  eq(polygons.length, 2); // number of polygons
  eq(polygons[0].length, 1); // number of rings in first polygon
  eq(polygons[0][0].slice(0, 5), [
    [32.8356246948245, 34.69983673095709],
    [32.84080886840826, 34.699466705322436],
    [32.84599304199236, 34.699466705322436],
    [32.853767395019645, 34.699466705322436],
    [32.859687805175724, 34.70057678222679]
  ]);
});

test("get polygons for Sri Lanka", async ({ eq }) => {
  const geojson = JSON.parse(findAndRead("sri-lanka.geojson", { encoding: "utf-8" }));
  const polygons = getPolygons(geojson);
  eq(polygons.length, 1); // number of polygons
  eq(polygons[0].length, 1); // number of rings in first polygon
  eq(polygons, [
    [
      [
        [81.7879590188914, 7.523055324733164],
        [81.63732221876059, 6.481775214051921],
        [81.21801964714433, 6.197141424988288],
        [80.34835696810441, 5.968369859232155],
        [79.87246870312853, 6.76346344647493],
        [79.69516686393513, 8.200843410673386],
        [80.14780073437964, 9.824077663609557],
        [80.83881798698656, 9.268426825391188],
        [81.30431928907177, 8.56420624433369],
        [81.7879590188914, 7.523055324733164]
      ]
    ]
  ]);
});

test("calculate intersection of Sri-Lanka with GeoTIFF", async ({ eq }) => {
  // same crs as geojson
  const arrayBuffer = await findAndRead("gadas-export-4326.tif");
  const geotiff = await from(arrayBuffer);
  const image = await geotiff.getImage();
  const precise_bbox = getPreciseBoundingBox(image);
  const raster_values = await geotiff.readRasters();
  const raster_bbox = precise_bbox.map(str => Number(str));
  const raster_height = image.getHeight();
  const raster_width = image.getWidth();

  const [resolutionX, resolutionY] = image.getResolution();
  const pixel_width = Math.abs(resolutionX);
  const pixel_height = Math.abs(resolutionY);

  const geojson = JSON.parse(findAndRead("sri-lanka.geojson", { encoding: "utf-8" }));

  const MOST_COMMON_VALUE = "65,65,67,255";

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  let values = [];

  const sizes = { band: 4, column: raster_width, row: raster_height };

  calculateCore({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    geometry: geojson,
    per_pixel: ({ row: rowIndex, column: columnIndex }) => {
      if (rowIndex < minRow) minRow = rowIndex;
      if (rowIndex > maxRow) maxRow = rowIndex;
      if (columnIndex < minCol) minCol = columnIndex;
      if (columnIndex > maxCol) maxCol = columnIndex;
      // hide raster values, by setting 4th band value to zero
      values = values.concat(
        clip({
          data: raster_values,
          flat: true,
          layout: "[band][row,column]",
          rect: {
            band: [0, 3],
            column: [columnIndex, columnIndex],
            row: [rowIndex, rowIndex]
          },
          sizes
        }).data.join(",")
      );
      update({
        data: raster_values,
        layout: "[band][row,column]",
        point: {
          band: 3,
          row: rowIndex,
          column: columnIndex
        },
        sizes,
        value: 0
      });
    },
    geometry_bbox: getBoundingBox(geojson)
  });

  eq(get_most_common(values)[0], MOST_COMMON_VALUE);

  writeImage("gadas-export-4326-sri-lanka", raster_values, [raster_width, raster_height]);

  const EXPECTED_MIN_ROW = 91;
  const EXPECTED_MAX_ROW = 266;
  const EXPECTED_MIN_COL = 480;
  const EXPECTED_MAX_COL = 575;

  eq(minRow, EXPECTED_MIN_ROW);
  eq(maxRow, EXPECTED_MAX_ROW);
  eq(minCol, EXPECTED_MIN_COL);
  eq(maxCol, EXPECTED_MAX_COL);
  // eq(most_common_value, []);

  // should have same results if project geojson onto raster's coordinate space
  const polygon = getPolygons(geojson)[0];
  const xmin = Number(precise_bbox[0]);
  const ymin = Number(precise_bbox[1]);
  for (let i = 0; i < polygon.length; i++) {
    polygon[i] = polygon[i].map(([x, y]) => [(x - xmin) / pixel_width, (y - ymin) / pixel_height]);
  }

  // reset
  minRow = Infinity;
  maxRow = -Infinity;
  minCol = Infinity;
  maxCol = -Infinity;

  calculateCore({
    // bounding box where bottom left is (0,0)
    raster_bbox: [0, 0, raster_width, raster_height],
    raster_height,
    raster_width,
    pixel_height: 1,
    pixel_width: 1,
    geometry: polygon,
    per_pixel: ({ row: rowIndex, column: columnIndex }) => {
      if (rowIndex < minRow) minRow = rowIndex;
      if (rowIndex > maxRow) maxRow = rowIndex;
      if (columnIndex < minCol) minCol = columnIndex;
      if (columnIndex > maxCol) maxCol = columnIndex;
    },
    geometry_bbox: getBoundingBox(geojson)
  });

  eq(minRow, EXPECTED_MIN_ROW);
  eq(maxRow, EXPECTED_MAX_ROW);
  eq(minCol, EXPECTED_MIN_COL);
  eq(maxCol, EXPECTED_MAX_COL);
});

test("validate ranges", ({ eq }) => {
  ["sri-lanka.geojson", "sri-lanka-hires.geojson"].forEach(filename => {
    const result = calculate({
      raster_bbox: [69.15892987765864, 1.4662483490272988, 90.42846112765297, 11.81870408668788],
      raster_height: 475,
      raster_width: 968,
      pixel_height: 0.0217946436582328,
      pixel_width: 0.021972656249994144,
      geometry: JSON.parse(findAndRead(filename, { encoding: "utf-8" })),
      per_row_segment: ({ row, columns }) => {
        const [start, end] = columns;
        if (start > end) {
          throw new Error("uh oh. in row", row, "range", columns);
        }
      }
    });
    eq(result.rows.length, 475);
    result.rows.forEach(row => {
      const flattened = row.flat();
      eq(flattened, flattened.sort());
    });
  });
});

test("geometry larger than raster", ({ eq }) => {
  const result = calculate({
    // tile within the united states
    raster_bbox: [-11271133.50845855, 4381155.514617654, -10640325.58387179, 5012277.581474598],
    raster_height: 256,
    raster_width: 256,
    pixel_height: 2465.3205736599375,
    pixel_width: 2464.0934554170312,
    geometry: reprojectGeoJSON(JSON.parse(findAndRead("usa.geojson", "utf-8")), { from: 4326, to: 3857 }),
    per_row_segment: ({ row, columns }) => {
      try {
        const [start, end] = columns;
        eq(start <= end, true);
      } catch (error) {
        console.log("row:", row);
        console.log("columns:", columns);
        throw error;
      }
    }
  });
  result.rows.forEach(segs => {
    segs.forEach(([start, end]) => {
      eq(start <= end, true);
    });
  });
});

test("geometry extends beyond left edge of raster", ({ eq }) => {
  const result = calculate({
    // tile covers east of united states
    raster_bbox: [-10018754.171394622, -7.081154551613622e-10, 0, 10018754.171394624],
    raster_height: 256,
    raster_width: 256,
    pixel_height: 39135.75848201025,
    pixel_width: 39135.75848201024,
    geometry: reprojectGeoJSON(JSON.parse(findAndRead("usa.geojson", "utf-8")), { from: 4326, to: 3857 }),
    per_row_segment: ({ row, columns }) => {
      try {
        const [start, end] = columns;
        eq(start <= end, true);
      } catch (error) {
        console.log("row:", row);
        console.log("columns:", columns);
        throw error;
      }
    }
  });
  result.rows.forEach(segs => {
    segs.forEach(([start, end]) => {
      eq(start <= end, true);
    });
  });
});

test("rectangular hole", ({ eq }) => {
  const data = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  let pixel_count = 0;
  calculateCore({
    debug_level: 0,
    per_pixel: ({ row, column }) => {
      data[row][column] = 255;
      pixel_count++;
    },
    raster_bbox: [0, 0, 20, 20],
    raster_height: 4,
    raster_width: 4,
    pixel_height: 5,
    pixel_width: 5,
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [20, 0],
            [20, 20],
            [0, 20],
            [0, 0]
          ],
          [
            [5, 5],
            [5, 15],
            [15, 15],
            [15, 5],
            [5, 5]
          ]
        ]
      },
      bbox: [0, 0, 20, 20]
    }
  });
  eq(pixel_count, 12);
  writeImage("rect-hole", [data, data, data], [4, 4]);
});

test("hole support: Sri Lanka test case", async ({ eq }) => {
  // same crs as geojson
  const arrayBuffer = await findAndRead("gadas-export-4326.tif");
  const geotiff = await from(arrayBuffer);
  const raster_values = await geotiff.readRasters();
  const image = await geotiff.getImage();
  const precise_bbox = getPreciseBoundingBox(image);
  const raster_bbox = precise_bbox.map(str => Number(str));
  const raster_height = image.getHeight();
  const raster_width = image.getWidth();

  const [resolutionX, resolutionY] = image.getResolution();
  const pixel_width = Math.abs(resolutionX);
  const pixel_height = Math.abs(resolutionY);

  // geojson with box and hole cut out for Sri Lanka
  const geojson = JSON.parse(findAndRead("hole.geojson", { encoding: "utf-8" }));

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  calculateCore({
    raster_bbox,
    raster_height,
    raster_width,
    pixel_height,
    pixel_width,
    geometry: geojson,
    per_pixel: ({ row: rowIndex, column: columnIndex }) => {
      if (rowIndex < minRow) minRow = rowIndex;
      if (rowIndex > maxRow) maxRow = rowIndex;
      if (columnIndex < minCol) minCol = columnIndex;
      if (columnIndex > maxCol) maxCol = columnIndex;
      // hide raster values, by setting 4th band value to zero
      update({
        data: raster_values,
        layout: "[band][row,column]",
        point: {
          band: 3,
          row: rowIndex,
          column: columnIndex
        },
        sizes: {
          band: 4,
          row: raster_height,
          column: raster_width
        },
        value: 0
      });
    },
    geometry_bbox: getBoundingBox(geojson)
  });
  const EXPECTED_MIN_ROW = 83;
  const EXPECTED_MAX_ROW = 310;
  const EXPECTED_MIN_COL = 403;
  const EXPECTED_MAX_COL = 584;

  eq(minRow, EXPECTED_MIN_ROW);
  eq(maxRow, EXPECTED_MAX_ROW);
  eq(minCol, EXPECTED_MIN_COL);
  eq(maxCol, EXPECTED_MAX_COL);

  writeImage("hole", raster_values, [raster_width, raster_height]);
});
