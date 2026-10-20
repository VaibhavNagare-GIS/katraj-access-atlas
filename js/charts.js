import { COLORS, BANDS } from './config.js';
import { selectBand, selectRoad, locateStop, coverageView } from './map.js';
import { reduced } from './motion.js';
const charts = [];
const fmt = (n) => Number(n).toLocaleString('en-IN');
function table(id, headers, rows, action) {
  const box = document.getElementById(id);
  box.replaceChildren();
  const t = document.createElement('table'),
    head = document.createElement('thead'),
    tr = document.createElement('tr');
  headers.forEach((v) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = v;
    tr.append(th);
  });
  head.append(tr);
  t.append(head);
  const body = document.createElement('tbody');
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    row.forEach((v, j) => {
      const td = document.createElement('td');
      if (j === 0 && action) {
        const b = document.createElement('button');
        b.textContent = String(v);
        b.addEventListener('click', () => action(i));
        td.append(b);
      } else td.textContent = String(v);
      tr.append(td);
    });
    body.append(tr);
  });
  t.append(body);
  box.append(t);
}
function chart(id) {
  const el = document.getElementById(id),
    c = echarts.init(el, null, {
      renderer: 'canvas',
      devicePixelRatio: Math.min(devicePixelRatio, 2),
    });
  charts.push(c);
  new ResizeObserver(() => c.resize()).observe(el);
  return c;
}
const base = () => ({
  animation: !reduced(),
  animationDuration: 850,
  animationDurationUpdate: 450,
  animationEasing: 'cubicOut',
  textStyle: { fontFamily: 'Plex', color: COLORS.ink },
  tooltip: {
    trigger: 'item',
    renderMode: 'richText',
    confine: true,
    backgroundColor: COLORS.paper,
    borderColor: COLORS.ink,
    borderWidth: 2,
    textStyle: { fontFamily: 'Plex', fontSize: 13 },
  },
  grid: { left: 136, right: 58, top: 15, bottom: 32 },
  xAxis: {
    type: 'value',
    axisLabel: { fontFamily: 'Mono', fontSize: 11 },
    splitLine: { lineStyle: { color: '#ddd8cb' } },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: { fontSize: 12, color: COLORS.ink },
  },
  aria: { enabled: true },
});
export function initCharts(s) {
  const pro = s.proximity,
    roads = s.road_classes,
    stops = s.stop_ranking,
    ind = s.indicators;
  table(
    'proximity-table',
    ['Band', 'Buildings', 'Percent'],
    pro.map((r) => [r.distance_band, fmt(r.building_count), r.percentage.toFixed(2) + '%']),
    (i) => selectBand(pro[i].distance_band),
  );
  const pct = [
    (100 * ind.buildings_within_500m) / ind.building_count,
    ind.buffered_area_percentage,
    (100 * ind.road_length_in_coverage_km) / ind.total_mapped_road_length_km,
  ];
  table(
    'coverage-table',
    ['Measure', 'Covered', 'Total', 'Percent'],
    [
      ['Buildings', '13,424', '14,191', pct[0].toFixed(2) + '%'],
      ['Land, km²', '10.344', '11.668', pct[1].toFixed(2) + '%'],
      ['Road/path, km', '291.241', '316.721', pct[2].toFixed(2) + '%'],
    ],
    (i) => coverageView(i).catch(() => {}),
  );
  table(
    'roads-table',
    ['Class', 'Features', 'Length, km'],
    roads.map((r) => [r.road_class, fmt(r.feature_count), r.length_km.toFixed(3)]),
    (i) => selectRoad(roads[i].road_class),
  );
  let stopChart,
    proChart,
    coverageChart,
    roadChart,
    measure = 'length_km',
    matches = stops;
  const updateStops = () => {
    const q = document.getElementById('stop-search').value.trim().toLocaleLowerCase();
    matches = stops.filter(
      (r) => r.stop_name.toLocaleLowerCase().includes(q) || String(r.id).includes(q),
    );
    const top = matches.slice(0, 10);
    document.getElementById('stop-results').textContent = matches.length
      ? `${matches.length} matching records. Showing ${top.length} highest counts. Select a bar to locate a stop.`
      : 'No matching stop records.';
    table(
      'stops-table',
      ['Stop / ID', 'Nearby buildings'],
      matches.map((r) => [`${r.stop_name} / ${r.id}`, fmt(r.nearby_buildings)]),
      (i) => locateStop(matches[i].id),
    );
    if (stopChart) {
      const b = base();
      stopChart.setOption(
        {
          ...b,
          grid: { left: 125, right: 45, top: 15, bottom: 35 },
          yAxis: {
            ...b.yAxis,
            data: top.map((r) => String(r.id)),
            axisLabel: {
              fontSize: 12,
              formatter: (id, i) => {
                const n = top[i].stop_name;
                return `${n.length > 14 ? n.slice(0, 13) + '…' : n}\n#${id}`;
              },
            },
          },
          xAxis: {
            ...b.xAxis,
            name: 'Buildings within 500 m',
            nameLocation: 'middle',
            nameGap: 24,
            nameTextStyle: { fontSize: 11 },
          },
          series: [
            {
              type: 'bar',
              barMaxWidth: 20,
              data: top.map((r) => ({
                value: r.nearby_buildings,
                name: `${r.stop_name} (#${r.id})`,
              })),
              itemStyle: { color: COLORS.blue },
              emphasis: { itemStyle: { color: COLORS.orange } },
              label: { show: true, position: 'right', fontFamily: 'Mono', fontSize: 11 },
            },
          ],
          graphic: top.length
            ? []
            : [
                {
                  type: 'text',
                  left: 'center',
                  top: 'middle',
                  style: { text: 'No matching stops', fill: COLORS.ink, font: '14px Plex' },
                },
              ],
        },
        true,
      );
    }
  };
  updateStops();
  document.getElementById('stop-search').addEventListener('input', updateStops);
  const updateRoad = () => {
    if (!roadChart) return;
    const sorted = [...roads].sort((a, b) => b[measure] - a[measure]),
      b = base();
    roadChart.setOption(
      {
        ...b,
        grid: { left: 102, right: 48, top: 12, bottom: 35 },
        xAxis: {
          ...b.xAxis,
          name: measure === 'length_km' ? 'Mapped length, km' : 'Feature count',
          nameLocation: 'middle',
          nameGap: 24,
          nameTextStyle: { fontSize: 11 },
        },
        yAxis: { ...b.yAxis, data: sorted.map((r) => r.road_class) },
        series: [
          {
            type: 'bar',
            barMaxWidth: 19,
            data: sorted.map((r) => ({ value: r[measure], name: r.road_class })),
            itemStyle: { color: COLORS.ink },
            emphasis: { itemStyle: { color: COLORS.orange } },
            label: {
              show: true,
              position: 'right',
              fontFamily: 'Mono',
              fontSize: 11,
              formatter: (p) =>
                measure === 'length_km' ? Number(p.value).toFixed(2) : fmt(p.value),
            },
          },
        ],
      },
      true,
    );
  };
  document.querySelectorAll('[data-road-measure]').forEach((b) =>
    b.addEventListener('click', () => {
      measure = b.dataset.roadMeasure;
      document.querySelectorAll('[data-road-measure]').forEach((x) => {
        const yes = x === b;
        x.classList.toggle('active', yes);
        x.setAttribute('aria-pressed', String(yes));
      });
      updateRoad();
    }),
  );
  document.getElementById('clear-band').addEventListener('click', () => selectBand('all'));
  document.getElementById('clear-road').addEventListener('click', () => selectRoad('all'));
  if (!window.echarts) {
    document.querySelectorAll('.chart').forEach((el) => {
      el.textContent = 'Chart library unavailable. Exact values are available below.';
    });
    return;
  }
  const init = () => {
    proChart = chart('proximity-chart');
    let b = base();
    proChart.setOption({
      ...b,
      yAxis: { ...b.yAxis, data: ['Within 300 m', 'Over 300 to 500 m', 'Over 500 m'] },
      xAxis: { ...b.xAxis, max: 12500 },
      series: [
        {
          type: 'bar',
          barMaxWidth: 36,
          data: pro.map((r, i) => ({
            value: r.building_count,
            name: r.distance_band,
            itemStyle: { color: [COLORS.green, COLORS.amber, COLORS.red][i] },
          })),
          label: {
            show: true,
            position: 'right',
            fontFamily: 'Mono',
            fontSize: 13,
            formatter: (p) => fmt(p.value),
          },
          emphasis: { itemStyle: { borderColor: COLORS.ink, borderWidth: 2 } },
        },
      ],
    });
    proChart.on('click', (p) => selectBand(pro[p.dataIndex].distance_band));
    coverageChart = chart('coverage-chart');
    b = base();
    coverageChart.setOption({
      ...b,
      grid: { left: 75, right: 55, top: 15, bottom: 32 },
      xAxis: { ...b.xAxis, max: 100, axisLabel: { fontSize: 11, formatter: '{value}%' } },
      yAxis: { ...b.yAxis, data: ['Buildings', 'Land area', 'Road/path'] },
      series: [
        {
          type: 'bar',
          barMaxWidth: 36,
          showBackground: true,
          backgroundStyle: { color: '#e8e3d7' },
          data: pct.map((v, i) => ({
            value: Number(v.toFixed(2)),
            name: [
              'Buildings within 500 m',
              'Land area in buffer union',
              'Road/path length in coverage',
            ][i],
            itemStyle: { color: [COLORS.orange, COLORS.ink, COLORS.blue][i] },
          })),
          label: {
            show: true,
            position: 'right',
            fontFamily: 'Mono',
            fontSize: 12,
            formatter: (p) => Number(p.value).toFixed(2) + '%',
          },
        },
      ],
    });
    coverageChart.on('click', (p) => coverageView(p.dataIndex).catch(() => {}));
    roadChart = chart('roads-chart');
    updateRoad();
    roadChart.on('click', (p) => selectRoad(p.name));
    stopChart = chart('stops-chart');
    updateStops();
    stopChart.on('click', (p) => {
      const r = matches[p.dataIndex];
      if (r) locateStop(r.id);
    });
    document.getElementById('numbers').dataset.chartsReady = 'true';
  };
  // Animate charts when their section approaches the viewport, not during page load.
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        init();
        observer.disconnect();
      }
    },
    { rootMargin: '150px' },
  );
  observer.observe(document.getElementById('numbers'));
  document.addEventListener('motionchange', () =>
    charts.forEach((c) => c.setOption({ animation: !reduced() })),
  );
  document.addEventListener('bandchange', (e) => {
    if (!proChart) return;
    proChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    const i = BANDS.indexOf(e.detail);
    if (i >= 0) proChart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: i });
  });
}
