import rasterstats as rs
from PIL import Image

result = rs.zonal_stats('./GADM-Ukraine.geojson', './spam2005v3r2_harvested-area_wheat_total.tiff', stats='count', nodata=-1, raster_out=True)[0]
print("result:", result)

mask = result['mini_raster_array'].mask
print("mask:", mask)

img = Image.fromarray(mask)
print("img:", img)

img.save("ukraine-rasterstats-mask.png")
