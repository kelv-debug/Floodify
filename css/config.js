var TILE_CONFIG = {
  // Map center [longitude, latitude] and initial zoom
  center: [121.0, 14.6], // Philippines
  zoom: 10,

  // Base map tile source — any {z}/{x}/{y} raster tile server
  baseTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  baseTileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  baseTileSubdomains: [],

  // Flood hazard tile overlay — set this to your tile server URL
  // Pattern: {z}/{x}/{y} (required), {s} for subdomains (optional)
  floodTileUrl: '', // e.g. 'https://your-server/tiles/flood/{z}/{x}/{y}.png'
  floodTileSubdomains: [],

  // NOAH-style hazard risk levels
  // Colors match the standard: red = high, orange = moderate, yellow = low, green = safe
  riskLevels: [
    { name: 'High Risk',     color: '#e60000', opacity: 0.55 },
    { name: 'Moderate Risk', color: '#ff8c00', opacity: 0.5  },
    { name: 'Low Risk',      color: '#ffd700', opacity: 0.45 },
    { name: 'Safe',          color: '#4caf50', opacity: 0.3  },
  ],

  // UI settings
  showLegend: true,
  showLayerToggle: true,
  minZoom: 4,
  maxZoom: 18,
};
