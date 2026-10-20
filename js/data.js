import { CONFIG } from './config.js';
const cache = new Map();
const files = {
  buildings: 'buildings',
  stops: 'stops',
  roads: 'roads',
  ward: 'ward',
  coverage: 'coverage',
  buffers: 'stop-buffers',
  clipped: 'roads-in-coverage',
  points: 'building-points',
};
export async function fetchJSON(url, timeout = 15000) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
    });
    if (!r.ok) throw Error(`Request failed (${r.status}).`);
    if (Number(r.headers.get('content-length') || 0) > 30000000) throw Error('Response too large.');
    const text = await r.text();
    if (text.length > 30000000) throw Error('Response too large.');
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}
export function validate(d, expected) {
  if (d?.type !== 'FeatureCollection' || !Array.isArray(d.features))
    throw Error('Expected a GeoJSON FeatureCollection.');
  if (expected !== undefined && d.features.length !== expected)
    throw Error(`Expected ${expected} features; received ${d.features.length}.`);
  function coords(a, depth = 0) {
    if (!Array.isArray(a) || depth > 9) throw Error('Invalid coordinates.');
    if (typeof a[0] === 'number') {
      if (a.length < 2 || !a.every(Number.isFinite) || Math.abs(a[0]) > 180 || Math.abs(a[1]) > 90)
        throw Error('Invalid geographic coordinate.');
    } else a.forEach((x) => coords(x, depth + 1));
  }
  const types = new Set([
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
  ]);
  d.features.forEach((f, i) => {
    if (f.type !== 'Feature' || !f.geometry || !types.has(f.geometry.type))
      throw Error('Unsupported geometry.');
    coords(f.geometry.coordinates);
    f.properties ||= {};
    f.id = f.properties.id ?? f.id ?? i + 1;
  });
  return d;
}
export function snapshot(key) {
  if (!files[key]) throw Error('Unknown dataset.');
  if (!cache.has(key))
    cache.set(
      key,
      fetchJSON(`data/geojson/${files[key]}.geojson`)
        .then((d) => validate(d, CONFIG.expected[key]))
        .catch((e) => {
          cache.delete(key);
          throw e;
        }),
    );
  return cache.get(key);
}
export const summary = () => fetchJSON('data/summary.json');
