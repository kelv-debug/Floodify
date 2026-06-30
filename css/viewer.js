(function () {
  'use strict';

  var config = TILE_CONFIG;

  // ── DOM references ──────────────────────────────────────────────
  var map2dEl = document.getElementById('map');
  var map3dEl = document.getElementById('map-3d');
  var legendEl = document.getElementById('legend');
  var toggleEl = document.getElementById('layer-toggle');
  var toggleCheckbox = document.getElementById('flood-toggle');
  var btn2d = document.getElementById('btn-2d');
  var btn3d = document.getElementById('btn-3d');
  var pitchControl = document.getElementById('pitch-control');
  var pitchSlider = document.getElementById('pitch-slider');

  var is3d = false;
  var map2d = null;
  var map3d = null;
  var floodLayer2d = null;
  var flood3dAdded = false;
  var map3dFailed = false;

  // ── Build tile URL template ─────────────────────────────────────
  function buildTileUrl(template, subdomains) {
    if (!subdomains || subdomains.length === 0) {
      return template.replace('{s}.', '');
    }
    return template;
  }

  // ── Initialize 2D map (Leaflet) ─────────────────────────────────
  function init2D() {
    if (map2d) return;
    map2d = L.map(map2dEl, {
      center: [config.center[1], config.center[0]],
      zoom: config.zoom,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
    });

    L.tileLayer(buildTileUrl(config.baseTileUrl, config.baseTileSubdomains), {
      attribution: config.baseTileAttribution,
      subdomains: config.baseTileSubdomains || [],
      maxZoom: config.maxZoom,
    }).addTo(map2d);

    if (config.floodTileUrl) {
      floodLayer2d = L.tileLayer(buildTileUrl(config.floodTileUrl, config.floodTileSubdomains), {
        opacity: 0.6,
        subdomains: config.floodTileSubdomains || [],
        maxZoom: config.maxZoom,
      }).addTo(map2d);
    }
  }

  // ── Initialize 3D map (MapLibre GL) ─────────────────────────────
  function init3D() {
    if (map3d || map3dFailed) return;

    try {
      console.log('Initializing 3D map...');

      var styleObj = {
        version: 8,
        name: 'Flood Map 3D',
        sources: {
          openmaptiles: {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet',
          },
          'terrain-source': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
          },
        },
        layers: [
          // Land
          { id: 'land', type: 'background', paint: { 'background-color': '#f2f0eb' } },
          { id: 'landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
            paint: { 'fill-color': '#d4e8c3', 'fill-opacity': 0.4 } },
          // Water
          { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
            paint: { 'fill-color': '#a0c8e0' } },
          // Parks
          { id: 'parks', type: 'fill', source: 'openmaptiles', 'source-layer': 'park',
            paint: { 'fill-color': '#c8e6a0', 'fill-opacity': 0.5 } },
          // Roads
          { id: 'roads-minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
            filter: ['in', 'class', 'minor', 'service', 'track'],
            paint: { 'line-color': '#ffffff', 'line-width': 1.5 } },
          { id: 'roads-major', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
            filter: ['in', 'class', 'primary', 'secondary', 'trunk'],
            paint: { 'line-color': '#f5d76e', 'line-width': 2.5 } },
          { id: 'roads-motorway', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
            filter: ['==', 'class', 'motorway'],
            paint: { 'line-color': '#f0a050', 'line-width': 3 } },
          // Building footprints (subtle)
          { id: 'buildings-base', type: 'fill', source: 'openmaptiles', 'source-layer': 'building',
            paint: { 'fill-color': '#d6d0c4', 'fill-opacity': 0.8 } },
          // ── Labels ──────────────────────────────────────────
          // Place names (cities, towns, villages)
          { id: 'place-country', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
            filter: ['==', 'class', 'country'],
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
              'text-size': 16, 'text-letter-spacing': 0.1 },
            paint: { 'text-color': '#555', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } },
          { id: 'place-state', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
            filter: ['==', 'class', 'state'],
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
              'text-size': 13 },
            paint: { 'text-color': '#666', 'text-halo-color': '#fff', 'text-halo-width': 1.2 } },
          { id: 'place-city', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
            filter: ['==', 'class', 'city'],
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'],
              'text-size': 15, 'text-anchor': 'center' },
            paint: { 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 2 } },
          { id: 'place-town', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
            filter: ['in', 'class', 'town', 'village'],
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
              'text-size': 12 },
            paint: { 'text-color': '#444', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } },
          { id: 'place-suburb', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
            filter: ['in', 'class', 'suburb', 'neighbourhood', 'quarter'],
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
              'text-size': 11 },
            paint: { 'text-color': '#666', 'text-halo-color': '#fff', 'text-halo-width': 1.2 } },
          // Road labels
          { id: 'road-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name',
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
              'text-size': 10, 'symbol-placement': 'line', 'text-max-angle': 30 },
            paint: { 'text-color': '#555', 'text-halo-color': '#fff', 'text-halo-width': 1 } },
          // Water labels
          { id: 'water-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'water_name',
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'],
              'text-size': 12, 'symbol-placement': 'line' },
            paint: { 'text-color': '#5a8aad', 'text-halo-color': '#fff', 'text-halo-width': 1 } },
          // POI labels
          { id: 'poi-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'poi',
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
              'text-size': 10, 'text-anchor': 'top', 'text-offset': [0, 0.5],
              'icon-image': '', 'text-optional': true },
            paint: { 'text-color': '#777', 'text-halo-color': '#fff', 'text-halo-width': 1 } },
          // Terrain
        ],
        terrain: { source: 'terrain-source', exaggeration: 1.0 },
        glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      };

      map3d = new maplibregl.Map({
        container: map3dEl,
        style: styleObj,
        center: config.center,
        zoom: config.zoom,
        pitch: 45,
        bearing: 0,
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
      });

      map3d.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-left');

      map3d.on('load', function () {
        console.log('3D map loaded OK');

        // ── 3D building extrusion ─────────────────────────────
        map3d.addLayer({
          id: '3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': '#d6d0c4',
            'fill-extrusion-height': ['to-number', ['get', 'render_height'], 3],
            'fill-extrusion-base': ['to-number', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.85,
          },
        });

        // ── Flood overlay ───────────────────────────────────
        if (config.floodTileUrl) {
          map3d.addSource('flood', {
            type: 'raster',
            tiles: [buildTileUrl(config.floodTileUrl, config.floodTileSubdomains)],
            tileSize: 256,
          });
          map3d.addLayer({
            id: 'flood-3d',
            type: 'raster',
            source: 'flood',
            paint: { 'raster-opacity': 0.6 },
          });
          flood3dAdded = true;
        }
      });

      map3d.on('error', function (e) {
        console.warn('3D map error:', e.error);
        map3dFailed = true;
        setTimeout(switchTo2D, 1000);
      });

      pitchSlider.addEventListener('input', function () {
        if (map3d) map3d.setPitch(Number(pitchSlider.value));
      });
    } catch (e) {
      console.error('3D init failed:', e);
      map3dFailed = true;
      setTimeout(switchTo2D, 500);
    }
  }

  // ── View switching ──────────────────────────────────────────────
  function switchTo2D() {
    map2dEl.style.display = 'block';
    map3dEl.style.display = 'none';
    pitchControl.style.display = 'none';
    btn2d.classList.add('active');
    btn3d.classList.remove('active');
    is3d = false;
    if (!map2d) init2D();
    setTimeout(function () { map2d.invalidateSize(); }, 100);
  }

  function switchTo3D() {
    if (map3dFailed) {
      console.warn('3D failed previously, staying in 2D');
      return;
    }
    map2dEl.style.display = 'none';
    map3dEl.style.display = 'block';
    pitchControl.style.display = 'flex';
    btn3d.classList.add('active');
    btn2d.classList.remove('active');
    is3d = true;
    if (!map3d) init3D();
    setTimeout(function () { if (map3d) map3d.resize(); }, 200);
  }

  btn2d.addEventListener('click', switchTo2D);
  btn3d.addEventListener('click', switchTo3D);

  // ── Flood layer toggle ──────────────────────────────────────────
  if (config.showLayerToggle && config.floodTileUrl) {
    toggleEl.style.display = 'flex';
    toggleCheckbox.checked = true;
    toggleCheckbox.addEventListener('change', function () {
      if (map2d && floodLayer2d) {
        if (toggleCheckbox.checked && !map2d.hasLayer(floodLayer2d)) {
          floodLayer2d.addTo(map2d);
        } else if (!toggleCheckbox.checked && map2d.hasLayer(floodLayer2d)) {
          map2d.removeLayer(floodLayer2d);
        }
      }
      if (map3d && flood3dAdded && map3d.getLayer('flood-3d')) {
        map3d.setLayoutProperty('flood-3d', 'visibility', toggleCheckbox.checked ? 'visible' : 'none');
      }
    });
  } else {
    toggleEl.style.display = 'none';
  }

  // ── Legend ───────────────────────────────────────────────────────
  if (config.showLegend && config.floodTileUrl) {
    legendEl.style.display = 'block';
    var itemsHtml = config.riskLevels.map(function (level) {
      return (
        '<div class="legend-item">' +
        '<span class="legend-swatch" style="background-color:' + level.color + ';opacity:' + level.opacity + '"></span>' +
        '<span class="legend-label">' + level.name + '</span></div>'
      );
    }).join('');
    legendEl.innerHTML = '<div class="legend-title">Flood Hazard</div>' + itemsHtml;
  } else {
    legendEl.style.display = 'none';
  }

  // ── Start in 2D ─────────────────────────────────────────────────
  switchTo2D();

  // Expose for debugging
  window.floodMap2d = map2d;
  window.floodMap3d = map3d;
})();
