import { summary } from './data.js';
import { initMotion } from './motion.js';
import { initHero } from './hero.js';
import { initMap } from './map.js';
import { initCharts } from './charts.js';
async function start() {
  initMotion();
  if (location.protocol === 'file:') {
    document.getElementById('app-message').hidden = false;
    document.getElementById('app-message').textContent =
      'Open the published website or serve this folder through HTTP. Direct file opening is not supported.';
    return;
  }
  try {
    const s = await summary();
    if (
      s.indicators.building_count !== 14191 ||
      s.proximity.reduce((n, r) => n + r.building_count, 0) !== 14191
    )
      throw Error('Summary consistency check failed.');
    for (const r of s.road_classes) {
      const option = document.createElement('option');
      option.value = r.road_class;
      option.textContent = r.road_class;
      document.getElementById('road-filter').append(option);
    }
    initCharts(s);
    initHero(s.bounds).catch(() => {
      document.getElementById('hero-map-status').hidden = false;
      document.getElementById('hero-map-status').textContent =
        'Overview unavailable. Use the interactive map below.';
      document
        .getElementById('hero-atlas')
        .setAttribute(
          'aria-label',
          'Geographic preview unavailable. Use the interactive map below.',
        );
    });
    await initMap(s);
    document.body.dataset.ready = 'true';
  } catch (e) {
    document.getElementById('app-message').hidden = false;
    document.getElementById('app-message').textContent =
      `Data could not load. ${e.message} Check the local server and bundled files.`;
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('revealed'));
  }
}
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
