#!/bin/sh -e

# download from https://github.com/GeoTIFF/test-data/
wget https://github.com/GeoTIFF/test-data/archive/refs/heads/main.zip -O geotiff-test-data.zip
unzip -j -o geotiff-test-data.zip "test-data-*/files/*" -d .
unzip spam2005v3r2_harvested-area_wheat_total.tiff.zip
rm geotiff-test-data.zip spam2005v3r2_harvested-area_wheat_total.tiff.zip

# download from https://github.com/DanielJDufour/geojson-test-data
wget https://github.com/DanielJDufour/geojson-test-data/archive/refs/heads/main.zip -O geojson-test-data.zip
unzip -o geojson-test-data.zip "geojson-test-data-*/files/*"
mkdir -p geojson-test-data
mv ./geojson-test-data-main/files/* ./geojson-test-data/.
rm geojson-test-data.zip
rm -r geojson-test-data-main

gdalwarp -t_srs EPSG:4326 gadas-export.png gadas-export-4326.tif

gdalwarp -t_srs EPSG:4326 gadas-export.png demo.png

