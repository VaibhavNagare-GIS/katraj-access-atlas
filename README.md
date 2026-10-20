<div align="center">
<img src="assets/icons/favicon.svg" width="64" height="64" alt="Katraj Access Atlas mark">
<h1>Katraj Access Atlas</h1>
<p><strong>How close is close?</strong><br>Building-to-bus-stop proximity, mapped clearly.</p>
<p><a href="LICENSE"><img src="docs/badges/license.svg" alt="Original code: MIT"></a> <img src="docs/badges/map.svg" alt="MapLibre map"> <img src="docs/badges/data.svg" alt="14,191 mapped buildings"> <img src="docs/badges/build.svg" alt="No build step"></p>
</div>

## 🧭 Overview

Katraj Access Atlas explores the relationship between building locations and mapped bus stops in Katraj-Dhankawadi, Pune. The atlas combines a geographic overview, a full-feature interactive map, linked analytical charts, and transparent methods in one responsive website.

The public application reads its analysis layers directly from bundled GeoJSON. It does not require a running GeoServer, database, API key, or backend. OpenStreetMap street tiles provide external geographic context and are enabled by default.

## ✨ Features

- **Geographic overview:** the complete study boundary, classified building footprints, mapped roads and bus stops, with the headline statistic below the map rather than over it.
- **Interactive exploration:** layer toggles, distance-band filtering, road-class selection, feature details, click-to-zoom and expanded-map mode.
- **Linked charts:** building distance bands, coverage comparison, road composition and searchable stop catchment ranking.
- **Analysis layers:** internal building points, 500 m stop buffers, dissolved ward coverage, stop catchment counts and intersecting road portions.
- **Accessible alternatives:** exact-value tables, keyboard-operable controls, visible focus states and reduced-motion support.
- **Responsive presentation:** white surfaces, larger supporting text, restrained card transitions and section reveals.
- **Downloadable outputs:** GeoJSON layers, summary CSVs, the data manifest and the supplied cartographic export.

## 📊 Study at a glance

| Measure                             |      Value |
| :---------------------------------- | ---------: |
| Building footprints                 |     14,191 |
| Bus-stop records                    |        148 |
| Mapped road/path features           |      4,888 |
| Buildings within 300 m              |     10,638 |
| Buildings over 300 to 500 m         |      2,786 |
| Buildings beyond 500 m              |        767 |
| Buildings within 500 m              | **94.60%** |
| Mean nearest-stop distance          |   228.76 m |
| Study area                          | 11.668 km² |
| Study area inside dissolved buffers |     88.65% |
| Complete mapped road/path length    | 316.721 km |
| Mapped line length inside coverage  | 291.241 km |

The 148 stop records occupy 144 distinct coordinate locations. Shared locations are retained. The 94.60% building share is calculated from 13,424 / 14,191, not by adding rounded percentages.

## 🔬 Method and interpretation

The analysis uses internal representative points for building footprints and Euclidean nearest-stop distances in **EPSG:32643**. Buildings are classified into three distance bands. Individual 500 m stop buffers are dissolved and intersected with the supplied ward boundary; mapped road/path portions inside that coverage are measured separately.

Static derived geometry was reproduced from the supplied source files using Shapely/GEOS and pyproj, then checked against the supplied PostGIS summary exports. It is not presented as a direct database export. Display GeoJSON uses longitude/latitude coordinates; all source records are retained.

**Proximity is not walking accessibility.** The atlas does not model pedestrian routes, barriers, stop entrances, schedules, frequency, capacity, population or ridership. The study uses a historical 2017 boundary and a clipped stop inventory. Catchments overlap, so stop-level building counts are not additive. Statistics describe the complete saved study and do not recalculate with map filters.

See [data provenance and limitations](docs/DATA.md) and the [data manifest](data/manifest.json).

## 🛠 Technology

| Component                                      | Role                                          |
| :--------------------------------------------- | :-------------------------------------------- |
| HTML, CSS and JavaScript modules               | Static application and responsive interface   |
| MapLibre GL JS 5.6.2                           | Geographic rendering and map interaction      |
| Apache ECharts 5.6.0                           | Interactive charts                            |
| GeoJSON and CSV                                | Bundled study geometry and summary statistics |
| OpenStreetMap                                  | External street basemap                       |
| Archivo Black, IBM Plex Sans and IBM Plex Mono | Locally bundled typography                    |

No application framework, package installation or build pipeline is required by the deployed frontend. JavaScript libraries, fonts and icons are bundled locally. Basemap availability depends on the external tile service; study geometry remains independent of that service.

## 🗂 Repository

```text
index.html              Application entry point
css/                    Responsive styling and motion
js/                     Maps, charts, data loading and interaction
assets/fonts/           Local typefaces and licence texts
assets/icons/           Interface marks and social icons
assets/maps/            Supplied cartographic export
data/geojson/           Complete study and derived layers
data/csv/               Original summary exports
data/summary.json       Chart and indicator values
data/manifest.json      Provenance and numerical checks
docs/                   Data and third-party documentation
LICENSE                 MIT licence for original code and documentation
NOTICE                  Third-party and dataset licensing scope
```

## 📚 Sources and credits

Study inputs are attributed in the supplied materials to **OpenCity / Pune Municipal Corporation**, with OpenStreetMap identifiers retained where supplied. The street basemap is **© OpenStreetMap contributors**. Data-source details, uncertainty and redistribution scope are recorded in [DATA.md](docs/DATA.md).

MapLibre, Apache ECharts, Primer Octicons, Font Awesome brand icons and the bundled fonts retain their original licences. See [third-party notices](docs/THIRD-PARTY.md).

## 🔒 Privacy

The application adds no analytics, cookies, credentials or external font requests. Basemap requests are sent to OpenStreetMap on page opening. Hosting and tile providers may retain their own access logs. No database or GeoServer credentials are part of this repository.

## ⚖ Licence

Original application code and original documentation are licensed under the **[MIT License](LICENSE)**.

Copyright © 2026 Vaibhav Nagare.

Third-party libraries, fonts, brand marks and source datasets retain their own terms and are not relicensed as MIT. Source-specific OpenCity redistribution terms have not been independently verified; see [NOTICE](NOTICE).

## 🤝 Author

**Vaibhav Nagare**

[<img src="assets/icons/github.svg" width="18" height="18" alt="GitHub"> GitHub](https://github.com/VaibhavNagare-GIS) · [<img src="assets/icons/linkedin.svg" width="18" height="18" alt="LinkedIn"> LinkedIn](https://www.linkedin.com/in/vaibhav-nagare-gis)
