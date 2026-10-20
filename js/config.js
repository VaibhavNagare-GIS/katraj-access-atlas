export const CONFIG = Object.freeze({
  expected: {
    buildings: 14191,
    stops: 148,
    roads: 4888,
    ward: 1,
    coverage: 1,
    buffers: 148,
    clipped: 4458,
    points: 14191,
  },
  basemapTiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
});
export const COLORS = {
  ink: '#171714',
  paper: '#ffffff',
  orange: '#f44b24',
  blue: '#2349d8',
  green: '#39713c',
  amber: '#e59b20',
  red: '#c63329',
};
export const BANDS = ['Within 300 m', 'Over 300 to 500 m', 'Over 500 m'];
