# Data and analytical provenance

## Inventory

- Buildings: 14,191 polygons, with 14,191 internal representative points.
- Stops: 148 unique stop IDs at 144 distinct coordinate locations. Shared coordinates retained.
- Roads/paths: 4,888 source records. Mixed line/multiline source geometries are supported.
- Ward: one supplied polygon from the 2017 administrative-ward resource.
- Over-500 m buildings: 767, also available through the map band filter.
- Individual buffers: 148, radius 500 m, 32 segments per quadrant.
- Dissolved ward coverage: one feature.
- Intersecting road portions: 4,458 nonempty line results in the reproduced snapshot.

## Inputs

Uploaded study GeoJSON files: buildings_katraj_ward.txt, busstops_katraj_ward.txt, road_network_katraj_ward.txt, katraj_ward_bound.txt. Supplied statistics: building_proximity.csv, road_classes.csv, indicators.csv. The supplied final map is included as assets/maps/katraj-map.png.

## Static reconstruction

The public application uses a bundled static dataset. Derived geometry was reproduced from the uploaded sources using Shapely/GEOS, pyproj and a nearest-neighbor index, not fabricated and not presented as a direct database export.

1. Remove Z only in the working copy and transform EPSG:4326 to EPSG:32643.
2. Use the internal representative point of each building footprint.
3. Find minimum Euclidean distance to the supplied stop points.
4. Classify <=300 m, >300 to <=500 m, and >500 m.
5. Buffer each stop by 500 m with 32 quadrant segments, dissolve and intersect with the ward.
6. Count representative points within 500 m of each stop. Catchments overlap.
7. Intersect road geometries with dissolved ward coverage and retain line parts.
8. Deliver longitude/latitude GeoJSON, rounded to seven decimals. No record sampling or permanent feature removal is used to optimize the display.

MapLibre tiles geometry internally and applies display-level rendering tolerances. This does not reduce the feature inventory in the delivered GeoJSON. Optional analysis sources load on first use. All buildings are loaded, not replaced by a heatmap or a sample.

## Cross-checks against exported PostGIS results

- 10,638 within 300 m, 2,786 over 300 to 500 m, 767 over 500 m.
- Mean nearest-stop distance: 228.76 m at exported precision.
- Dissolved coverage: 10.344 km², 88.65% of 11.668 km².
- Mapped line length: 316.721 km; inside coverage: 291.241 km.
- Within-500 m building share is calculated from 13,424 / 14,191 = 94.60% rounded. Adding rounded class percentages would give 94.59%; that is not used.
- Road share is 91.96% calculated from rounded exported lengths.
- Rounded class percentages sum to 99.99%. Rounded road-class lengths sum to 316.720 km. These are documented rounding differences, not silently corrected data.

Building and road static IDs are local source-order IDs. The OSM full_id and stop_id values are retained where supplied. No claim is made that local source-order IDs equal database pkid values. An optional nearest_stop_id property is an index result; ties at shared coordinates do not establish a unique operational stop.

## Sources

- Bus stops: OpenCity / Pune Municipal Corporation, Pune Bus Stops and Routes: https://data.opencity.in/dataset/pune-bus-stops-and-routes
- Ward: OpenCity, Pune Administrative Wards Map 2017: https://data.opencity.in/dataset/pune-wards-info/resource/686cd9cd-012f-4f97-913f-8c7003b3eb02
- Roads/buildings: supplied OSM-derived geometry, https://www.openstreetmap.org/copyright

Download dates, exact OSM extraction tool and resource-specific OpenCity redistribution licences are not verified. Confirm these before broad republication. A portal update date is not an observation date.

## Interpretation limits

Straight-line distance is not walking distance. The stop inventory is clipped to the ward; outside stops may matter near the edge. Buildings are not people. Service frequency, crossings, slopes, barriers and entrances are not modeled. The 2017 boundary is historical. Thresholds are exploratory, not asserted legal standards. Per-stop nearby-building counts overlap and are not additive.
