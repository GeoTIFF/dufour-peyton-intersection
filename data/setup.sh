#!/bin/sh -e

# download from https://github.com/GeoTIFF/test-data/
wget https://github.com/GeoTIFF/test-data/archive/refs/heads/main.zip -O geotiff-test-data.zip
unzip -j -o geotiff-test-data.zip "test-data-*/files/*" -d .
rm geotiff-test-data.zip

gdalwarp -t_srs EPSG:4326 gadas-export.png gadas-export-4326.tif

gdalwarp -t_srs EPSG:4326 gadas-export.png demo.png
