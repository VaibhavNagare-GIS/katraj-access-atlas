import { snapshot } from './data.js';
import { COLORS, BANDS, CONFIG } from './config.js';
export let heroMap;
export async function initHero(bounds) {
  const el = document.getElementById('hero-atlas');
  const [ward, buildings, stops, roads] = await Promise.all(
    ['ward', 'buildings', 'stops', 'roads'].map(snapshot),
  );
  if (!window.maplibregl) throw Error('MapLibre unavailable');
  heroMap = new maplibregl.Map({
    container: el,
    interactive: false,
    attributionControl: false,
    renderWorldCopies: false,
    fadeDuration: 0,
    style: {
      version: 8,
      sources: {},
      layers: [{ id: 'white', type: 'background', paint: { 'background-color': '#ffffff' } }],
    },
    center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
    zoom: 12,
  });
  heroMap.addControl(
    new maplibregl.AttributionControl({
      compact: false,
      customAttribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors · OpenCity / PMC',
    }),
    'bottom-right',
  );
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Error('Overview initialization timed out')), 15000);
    heroMap.once('load', () => {
      clearTimeout(t);
      resolve();
    });
  });
  heroMap.addSource('osm', {
    type: 'raster',
    tiles: [CONFIG.basemapTiles],
    tileSize: 256,
    maxzoom: 19,
  });
  heroMap.addLayer({
    id: 'streets',
    type: 'raster',
    source: 'osm',
    paint: { 'raster-opacity': 0.55 },
  });
  for (const [id, d] of Object.entries({ ward, buildings, stops, roads }))
    heroMap.addSource(id, { type: 'geojson', data: d, tolerance: 0.25 });
  heroMap.addLayer({
    id: 'roads',
    type: 'line',
    source: 'roads',
    paint: { 'line-color': '#777777', 'line-width': 0.7, 'line-opacity': 0.6 },
  });
  heroMap.addLayer({
    id: 'buildings',
    type: 'fill',
    source: 'buildings',
    paint: {
      'fill-color': [
        'match',
        ['get', 'distance_band'],
        BANDS[0],
        COLORS.green,
        BANDS[1],
        COLORS.amber,
        BANDS[2],
        COLORS.red,
        '#777777',
      ],
      'fill-opacity': 0.85,
    },
  });
  heroMap.addLayer({
    id: 'ward',
    type: 'line',
    source: 'ward',
    paint: { 'line-color': COLORS.ink, 'line-width': 2 },
  });
  heroMap.addLayer({
    id: 'stops',
    type: 'circle',
    source: 'stops',
    paint: {
      'circle-color': COLORS.blue,
      'circle-radius': 2.5,
      'circle-stroke-width': 0.6,
      'circle-stroke-color': '#ffffff',
    },
  });
  const fit = () => {
    heroMap.resize();
    heroMap.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: { top: 22, bottom: 34, left: 24, right: 24 }, duration: 0 },
    );
  };
  new ResizeObserver(fit).observe(el);
  fit();
  el.dataset.ready = 'true';
  heroMap.on('error', (e) => {
    if (String(e.error?.message || '').includes('tile.openstreetmap')) {
      const n = document.getElementById('hero-map-status');
      n.hidden = false;
      n.textContent = 'Street tiles unavailable. Study geometry remains visible.';
    }
  });
}
