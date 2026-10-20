import { snapshot } from './data.js';
import { COLORS, BANDS, CONFIG } from './config.js';
import { reduced } from './motion.js';
export let map;
let ready = false,
  data = {},
  band = 'all',
  road = 'all',
  bounds,
  popup,
  expanded = false;
const empty = { type: 'FeatureCollection', features: [] };
const groups = {
  buildings: ['buildings-fill', 'buildings-edge'],
  stops: ['stops-circle'],
  roads: ['roads-line'],
  coverage: ['coverage-fill'],
  ward: ['ward-line'],
  buffers: ['buffers-line'],
  clipped: ['clipped-line'],
  counts: ['counts-circle'],
  points: ['points-circle'],
};
const state = {
  buildings: true,
  stops: true,
  roads: true,
  coverage: true,
  ward: true,
  buffers: false,
  clipped: false,
  counts: false,
  points: false,
};
const color = [
  'match',
  ['get', 'distance_band'],
  BANDS[0],
  COLORS.green,
  BANDS[1],
  COLORS.amber,
  BANDS[2],
  COLORS.red,
  '#8a887e',
];
const $ = (id) => document.getElementById(id);
function source(k, d) {
  if (map.getSource(k)) map.getSource(k).setData(d);
  else map.addSource(k, { type: 'geojson', data: d, tolerance: 0.25, maxzoom: 18 });
}
function visible(k) {
  for (const id of groups[k])
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', state[k] ? 'visible' : 'none');
}
function notice(text, hide = false) {
  $('map-loading').textContent = text;
  $('map-loading').hidden = hide;
}
function addLayers() {
  const layers = [
    {
      id: 'coverage-fill',
      type: 'fill',
      source: 'coverage',
      paint: { 'fill-color': '#cad6b4', 'fill-opacity': 0.55 },
    },
    {
      id: 'buffers-line',
      type: 'line',
      source: 'buffers',
      layout: { visibility: 'none' },
      paint: {
        'line-color': COLORS.blue,
        'line-width': 1,
        'line-opacity': 0.55,
        'line-dasharray': [3, 2],
      },
    },
    {
      id: 'roads-line',
      type: 'line',
      source: 'roads',
      paint: {
        'line-color': '#62635c',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 15, 1.1, 18, 3],
      },
    },
    {
      id: 'clipped-line',
      type: 'line',
      source: 'clipped',
      layout: { visibility: 'none' },
      paint: { 'line-color': COLORS.blue, 'line-width': 2.5 },
    },
    {
      id: 'buildings-fill',
      type: 'fill',
      source: 'buildings',
      paint: { 'fill-color': color, 'fill-opacity': 0.87 },
    },
    {
      id: 'buildings-edge',
      type: 'line',
      source: 'buildings',
      minzoom: 15,
      paint: { 'line-color': '#393a31', 'line-width': 0.45, 'line-opacity': 0.5 },
    },
    {
      id: 'points-circle',
      type: 'circle',
      source: 'points',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': COLORS.ink,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 2.5],
      },
    },
    {
      id: 'ward-line',
      type: 'line',
      source: 'ward',
      paint: { 'line-color': COLORS.ink, 'line-width': 2 },
    },
    {
      id: 'counts-circle',
      type: 'circle',
      source: 'stops',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': COLORS.orange,
        'circle-opacity': 0.55,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': COLORS.ink,
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['to-number', ['get', 'nearby_buildings'], 0],
          0,
          3,
          1700,
          22,
        ],
      },
    },
    {
      id: 'stops-circle',
      type: 'circle',
      source: 'stops',
      paint: {
        'circle-color': COLORS.blue,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.7, 15, 5, 18, 8],
        'circle-stroke-color': COLORS.paper,
        'circle-stroke-width': 1,
      },
    },
  ];
  layers.forEach((l) => map.addLayer(l));
  source('selected', empty);
  map.addLayer({
    id: 'selected-fill',
    type: 'fill',
    source: 'selected',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.35 },
  });
  map.addLayer({
    id: 'selected-line',
    type: 'line',
    source: 'selected',
    filter: ['!=', ['geometry-type'], 'Point'],
    paint: { 'line-color': COLORS.ink, 'line-width': 3 },
  });
  map.addLayer({
    id: 'selected-point',
    type: 'circle',
    source: 'selected',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-color': COLORS.orange,
      'circle-radius': 9,
      'circle-stroke-color': COLORS.ink,
      'circle-stroke-width': 2,
    },
  });
}
function filters() {
  if (!ready) return;
  const f = band === 'all' ? null : ['==', ['get', 'distance_band'], band];
  for (const id of ['buildings-fill', 'buildings-edge', 'points-circle']) map.setFilter(id, f);
  for (const id of ['roads-line', 'clipped-line'])
    map.setFilter(id, road === 'all' ? null : ['==', ['get', 'road_class'], road]);
  $('selection-status').textContent =
    `${band === 'all' ? 'All building distance bands' : band} · ${road === 'all' ? 'All road classes' : road}`;
}
export function selectBand(value) {
  band = value;
  document.querySelectorAll('[data-band]').forEach((b) => {
    const yes = b.dataset.band === value;
    b.classList.toggle('active', yes);
    b.setAttribute('aria-pressed', String(yes));
  });
  state.buildings = true;
  document.querySelector('[data-layer="buildings"]').checked = true;
  if (ready) {
    visible('buildings');
    map.getSource('selected').setData(empty);
  }
  filters();
  document.dispatchEvent(new CustomEvent('bandchange', { detail: value }));
}
export function selectRoad(value) {
  road = value;
  $('road-filter').value = value;
  state.roads = true;
  document.querySelector('[data-layer="roads"]').checked = true;
  if (ready) visible('roads');
  filters();
}
function inspect(f, kind) {
  const p = f.properties || {};
  let title,
    rows = [];
  if (kind === 'stop') {
    title = p.stop_name || `Stop ${p.id}`;
    rows = [
      ['Stop ID', p.id],
      ['Buildings within 500 m', p.nearby_buildings ?? 'Not supplied'],
    ];
  } else if (kind === 'building') {
    title = p.name || 'Mapped building';
    rows = [
      ['OSM identifier', p.osm_id || 'Not supplied'],
      ['Nearest-stop distance', `${Number(p.distance_m).toFixed(2)} m`],
      ['Distance band', p.distance_band],
    ];
  } else {
    title = p.name || 'Mapped road/path';
    rows = [['Class', p.road_class || 'unknown']];
    if (p.length_m != null) rows.push(['Length', `${Number(p.length_m).toFixed(2)} m`]);
  }
  const panel = $('feature-inspector');
  panel.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = title;
  panel.append(strong);
  const dl = document.createElement('dl');
  for (const [label, value] of rows) {
    const wrap = document.createElement('div'),
      dt = document.createElement('dt'),
      dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = String(value ?? 'Not supplied');
    wrap.append(dt, dd);
    dl.append(wrap);
  }
  panel.append(dl);
  const content = document.createElement('div'),
    h = document.createElement('h4');
  h.textContent = title;
  content.append(h);
  for (const [label, value] of rows) {
    const p = document.createElement('p');
    p.textContent = `${label}: ${value ?? 'Not supplied'}`;
    content.append(p);
  }
  return content;
}
function show(f, kind, lngLat) {
  map.easeTo({
    center: lngLat,
    zoom: Math.max(map.getZoom(), kind === 'building' ? 17 : 16),
    duration: reduced() ? 0 : 450,
  });
  map.getSource('selected').setData({ type: 'FeatureCollection', features: [f] });
  popup?.remove();
  popup = new maplibregl.Popup({ maxWidth: '270px' })
    .setLngLat(lngLat)
    .setDOMContent(inspect(f, kind))
    .addTo(map);
}
export async function locateStop(id) {
  if (!ready) return;
  const f = data.stops.features.find((f) => String(f.properties.id) === String(id));
  if (!f) return;
  state.stops = true;
  document.querySelector('[data-layer="stops"]').checked = true;
  visible('stops');
  const center = f.geometry.coordinates.slice(0, 2);
  show(f, 'stop', center);
  $('explore').scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth' });
}
async function extra(key) {
  if (key === 'counts') return;
  if (!data[key]) {
    data[key] = await snapshot(key);
    source(key, data[key]);
  }
}
export async function coverageView(i) {
  if (!ready) return;
  if (i === 0) selectBand('all');
  if (i === 1) {
    state.buildings = false;
    state.coverage = true;
    state.clipped = false;
  }
  if (i === 2) {
    await extra('clipped');
    state.buildings = false;
    state.coverage = true;
    state.clipped = true;
  }
  for (const k of ['buildings', 'coverage', 'clipped']) {
    document.querySelector(`[data-layer="${k}"]`).checked = state[k];
    visible(k);
  }
  $('selection-status').textContent = [
    'Building proximity view',
    'Dissolved land-coverage view',
    'Road portions inside coverage',
  ][i];
}
function fit() {
  if (ready)
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: innerWidth < 600 ? 35 : 55, duration: reduced() ? 0 : 700 },
    );
}
function expand(value) {
  expanded = value;
  $('atlas-shell').classList.toggle('expanded', value);
  document.body.classList.toggle('no-scroll', value);
  $('expand-map').textContent = value ? 'Close expanded map ×' : 'Expand map ↗';
  $('expand-map').setAttribute('aria-pressed', String(value));
  for (const sel of [
    '.masthead',
    '.hero',
    '.inventory',
    '#explore>.section-heading',
    '#numbers',
    '#method',
    '.footer',
  ])
    document.querySelector(sel).inert = value;
  requestAnimationFrame(() => {
    map?.resize();
    $('expand-map').focus();
  });
}
export async function initMap(s) {
  bounds = s.bounds;
  try {
    if (!window.maplibregl) throw Error('MapLibre could not load.');
    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {},
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } },
        ],
      },
      center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
      zoom: 13,
      minZoom: 10,
      maxZoom: 19,
      attributionControl: false,
      renderWorldCopies: false,
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors · OpenCity / PMC',
      }),
      'bottom-right',
    );
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Map initialization timed out.')), 20000);
      map.once('load', () => {
        clearTimeout(timer);
        resolve();
      });
      map.once('error', (e) => {
        clearTimeout(timer);
        reject(e.error);
      });
    });
    const keys = ['ward', 'coverage', 'roads', 'buildings', 'stops'],
      values = await Promise.all(keys.map(snapshot));
    keys.forEach((k, i) => {
      data[k] = values[i];
      source(k, values[i]);
    });
    for (const k of ['buffers', 'clipped', 'points']) source(k, empty);
    addLayers();
    map.addSource('osm', {
      type: 'raster',
      tiles: [CONFIG.basemapTiles],
      tileSize: 256,
      maxzoom: 19,
    });
    map.addLayer(
      { id: 'osm-tiles', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.72 } },
      'coverage-fill',
    );
    ready = true;
    fit();
    filters();
    notice('', true);
    $('map').dataset.ready = 'true';
    map.on('click', (e) => {
      const layers = [
        'stops-circle',
        'counts-circle',
        'points-circle',
        'buildings-fill',
        'clipped-line',
        'roads-line',
      ].filter((id) => map.getLayoutProperty(id, 'visibility') !== 'none');
      const fs = map.queryRenderedFeatures(
        [
          [e.point.x - 3, e.point.y - 3],
          [e.point.x + 3, e.point.y + 3],
        ],
        { layers },
      );
      if (!fs.length) {
        map.easeTo({
          center: e.lngLat,
          zoom: Math.max(map.getZoom(), 16),
          duration: reduced() ? 0 : 450,
        });
        return;
      }
      const f = fs[0],
        kind =
          f.layer.id === 'points-circle'
            ? 'building'
            : f.layer.id.includes('circle')
              ? 'stop'
              : f.layer.id.startsWith('buildings')
                ? 'building'
                : 'road';
      const properties =
        f.layer.id === 'points-circle'
          ? data.buildings.features.find((b) => String(b.properties.id) === String(f.properties.id))
              ?.properties || f.properties
          : f.properties;
      show({ type: 'Feature', properties, geometry: f.geometry }, kind, e.lngLat);
    });
    map.on('mousemove', (e) => {
      map.getCanvas().style.cursor = map.queryRenderedFeatures(e.point, {
        layers: ['stops-circle', 'buildings-fill'],
      }).length
        ? 'pointer'
        : '';
    });
    map.on('error', (e) => {
      if (String(e.error?.message || '').includes('tile.openstreetmap'))
        $('map-status').textContent = 'Street tiles could not load. Study layers remain available.';
    });
    new ResizeObserver(() => map.resize()).observe(document.querySelector('.map-stage'));
  } catch (e) {
    notice(`Interactive map unavailable: ${e.message} Use the map download and data tables below.`);
    $('map').dataset.ready = 'failed';
  }
  bind();
}
function bind() {
  document.querySelectorAll('[data-layer]').forEach((cb) =>
    cb.addEventListener('change', async () => {
      const k = cb.dataset.layer;
      if (!ready) {
        cb.checked = state[k];
        return;
      }
      cb.disabled = true;
      try {
        if (cb.checked) await extra(k);
        state[k] = cb.checked;
        visible(k);
      } catch (e) {
        cb.checked = false;
        state[k] = false;
        $('map-status').textContent = e.message;
      } finally {
        cb.disabled = false;
      }
    }),
  );
  document
    .querySelectorAll('[data-band]')
    .forEach((b) => b.addEventListener('click', () => selectBand(b.dataset.band)));
  $('road-filter').addEventListener('change', (e) => selectRoad(e.target.value));
  $('reset-map').addEventListener('click', () => {
    selectBand('all');
    selectRoad('all');
    fit();
    popup?.remove();
    if (ready) map.getSource('selected').setData(empty);
    $('feature-inspector').replaceChildren();
    const hint = document.createElement('p');
    hint.textContent = 'Select a building, stop or road for details.';
    $('feature-inspector').append(hint);
  });
  $('expand-map').addEventListener('click', () => expand(!expanded));
  document.addEventListener('keydown', (e) => {
    if (!expanded) return;
    if (e.key === 'Escape') expand(false);
    if (e.key === 'Tab') {
      const a = [
        ...$('atlas-shell').querySelectorAll('button,a,input,select,summary,[tabindex="0"]'),
      ].filter((x) => x.getClientRects().length && !x.disabled && !x.closest('[hidden]'));
      if (e.shiftKey && document.activeElement === a[0]) {
        e.preventDefault();
        a.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === a.at(-1)) {
        e.preventDefault();
        a[0].focus();
      }
    }
  });
  $('basemap-toggle').addEventListener('change', (e) => {
    if (!ready) return;
    if (!map.getSource('osm')) {
      map.addSource('osm', {
        type: 'raster',
        tiles: [CONFIG.basemapTiles],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors',
      });
      map.addLayer(
        { id: 'osm-tiles', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.7 } },
        'coverage-fill',
      );
    }
    map.setLayoutProperty('osm-tiles', 'visibility', e.target.checked ? 'visible' : 'none');
  });
}
