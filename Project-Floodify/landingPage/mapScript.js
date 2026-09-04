// ======================================================
// Floodify - MapLibre Integration & Interactivity
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const provinceSelect = document.getElementById("province-select");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const button2D = document.getElementById("btn-2d");
  const button3D = document.getElementById("btn-3d");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const currentProvince = document.getElementById("current-province");
  const mobileMenuIcon = document.getElementById("mobile-menu-icon");
  const barangaySelect = document.getElementById("barangay-select");

  // Map Variables
  let map;
  let provinceBounds = {};
  let userMarker = null;
  let provinceList = [];
  let currentLoadedProvince = null;

  const displayNames = {
    "bulacan": "Bulacan & Metro Manila"
  };

  function getDisplayName(province) {
    return displayNames[province.toLowerCase()] || province;
  }

  const floodSource = "flood-source";
  const floodLayer = "flood-layer";

  // Register PMTiles Protocol
  if (typeof pmtiles !== "undefined") {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }

  // --- Initialize Map ---
  async function initializeMap() {
    if (map) {
      map.resize();
      return;
    }

    map = new maplibregl.Map({
      container: "map",
      style: "data/liberty.json",
      center: [121.0437, 14.6760],
      zoom: 8,
      pitch: 0,
      bearing: 0
    });

    map.on("error", (e) => {
      console.error("MapLibre Error:", e);
    });

    map.on("load", async () => {
      map.resize();
      await loadProvinceBounds();
      populateProvinceDropdown();

      const initialProvince = provinceSelect ? provinceSelect.value || "Bulacan" : "Bulacan";

      loadProvince(initialProvince, {
        customBounds: initialProvince === "Bulacan" ? provinceBounds["meycauayan"] : null
      });

      setActiveView("2d");
      initializeLocation();
      setupControls();
    });
  }

  // --- Load Province Bounds ---
  async function loadProvinceBounds() {
    try {
      const response = await fetch("data/provinceBounds.json");
      provinceBounds = await response.json();
    } catch (err) {
      console.error("Failed to load province bounds:", err);
    }
  }

  // --- Load Province Tile Data ---
  function loadProvince(province, options = {}) {
    if (!map) return;

    if (currentProvince) {
      currentProvince.textContent = getDisplayName(province);
    }

    currentLoadedProvince = province;

    if (currentProvince) {
      currentProvince.textContent = province;
    }

    if (map.getLayer(floodLayer)) map.removeLayer(floodLayer);
    if (map.getSource(floodSource)) map.removeSource(floodSource);

    const fileName = province.toLowerCase().trim();
    const BASE_TILE_URL = "https://drsouqrmvrxlbxpkvgnf.supabase.co/storage/v1/object/public/floodTiles/tiles/";


    map.addSource(floodSource, {
      type: "vector",
      url: `pmtiles://${BASE_TILE_URL}${fileName}.pmtiles?v=${Date.now()}`
    });

    map.addLayer({
      id: floodLayer,
      type: "fill",
      source: floodSource,
      "source-layer": "flood",
      paint: {
        "fill-color": [
          "match", ["coalesce", ["get", "Var"], ["get", "HAZ"]],
          1, "#FFD54F",
          2, "#FB8C00",
          3, "#E53935",
          "#9E9E9E"
        ],
        "fill-opacity": 0.55,
        "fill-outline-color": "rgba(0,0,0,0)"
      }
    });


    if (options.customBounds) {
      map.fitBounds(options.customBounds, { padding: 40, duration: 1000, maxZoom: 15 });
    } else {
      zoomToProvince(province);
    }

    const locationName = document.getElementById("location-name");
    if (locationName) {
      locationName.innerHTML = `
  <span class="location-label">Viewing Province</span><br>
  <strong>${getDisplayName(province)}</strong>
`;
    }
  }

  // --- Zoom to Selected Province ---
  function zoomToProvince(province) {
    const bounds = provinceBounds[province.toLowerCase()];
    if (!bounds) {
      console.warn("No bounds found for province:", province);
      return;
    }

    map.fitBounds(bounds, {
      padding: 40,
      duration: 1000,
      maxZoom: 14
    });
  }

  // --- Geolocation ---
  function initializeLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        if (!userMarker) {
          userMarker = new maplibregl.Marker({ color: "#d43b3b" })
            .setLngLat([lng, lat])
            .addTo(map);
        } else {
          userMarker.setLngLat([lng, lat]);
        }

        updateLocationCard();
      },
      (error) => {
        console.warn("Geolocation permission denied or failed:", error);
      }
    );
  }

  function updateLocationCard() {
    const status = document.querySelector(".location-status");
    const locationName = document.getElementById("location-name");

    if (status) {
      status.className = "location-status safe";
      status.innerHTML = `<span class="status-dot"></span> GPS Location Detected`;
    }

    if (locationName && provinceSelect) {
      locationName.innerHTML = `
      <span class="location-label">Viewing Province</span><br>
      <strong>${getDisplayName(provinceSelect.value || "Bulacan")}</strong>
    `;
    }
  }

  // --- Controls & View Modes ---
  function setupControls() {
    if (provinceSelect) {
      provinceSelect.addEventListener("change", () => {
        if (searchInput) searchInput.value = provinceSelect.value;
        loadProvince(provinceSelect.value);
      });
    }

    if (button2D) {
      button2D.addEventListener("click", () => {
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        setActiveView("2d");
      });
    }

    if (button3D) {
      button3D.addEventListener("click", () => {
        map.easeTo({ pitch: 60, bearing: -20, duration: 800 });
        setActiveView("3d");
      });
    }

    function goToMeycauayan() {
      loadProvince("Bulacan", { customBounds: provinceBounds["meycauayan"] });
      if (provinceSelect) provinceSelect.value = "Bulacan";
    }

    if (barangaySelect) {
      barangaySelect.addEventListener("change", () => {
        const brgy = barangaySelect.value;
        if (brgy) focusBarangay(brgy);
      });
    }

    const buttonHome = document.getElementById("btn-home");
    if (buttonHome) {
      buttonHome.addEventListener("click", goToMeycauayan);
    }

    const exploreToggle = document.getElementById("explore-toggle");
    const explorePanel = document.getElementById("explore-panel");

    if (exploreToggle && explorePanel) {
      exploreToggle.addEventListener("click", () => {
        const isOpen = explorePanel.classList.toggle("open");
        exploreToggle.setAttribute("aria-expanded", isOpen);
      });
    }

    const floodInfoToggle = document.getElementById("flood-info-toggle");
    const floodInfoPanel = document.getElementById("flood-info-panel");
    const floodInfoClose = document.getElementById("flood-info-close");

    if (floodInfoToggle && floodInfoPanel) {
      floodInfoToggle.addEventListener("click", () => {
        floodInfoPanel.classList.toggle("open");
      });
    }

    if (floodInfoClose && floodInfoPanel) {
      floodInfoClose.addEventListener("click", () => {
        floodInfoPanel.classList.remove("open");
      });
    }
  }



  function focusBarangay(name) {
    const data = barangayAnchors[name];
    if (!data) {
      console.warn("No anchor data for barangay:", name);
      return;
    }

    function doZoom() {
      const extent = data.extent;
      const hasUsableExtent = extent &&
        (Math.abs(extent[2] - extent[0]) > 0.003 || Math.abs(extent[1] - extent[3]) > 0.003);

      if (hasUsableExtent) {
        const [west, north, east, south] = extent;
        map.fitBounds([[west, south], [east, north]], {
          padding: 50,
          duration: 1200,
          maxZoom: 17
        });
      } else {
        map.flyTo({ center: data.center, zoom: 16, duration: 1200 });
      }
    }

    if (currentLoadedProvince !== "Bulacan") {
      if (provinceSelect) provinceSelect.value = "Bulacan";
      loadProvince("Bulacan", { customBounds: null }); // skip default zoom, we'll override below
      map.once("idle", doZoom);
    } else {
      doZoom();
    }
  }




  function setActiveView(view) {
    if (button2D) button2D.classList.toggle("active", view === "2d");
    if (button3D) button3D.classList.toggle("active", view === "3d");
  }

  // --- Search Functionality ---
  // --- Search Functionality (Photon-powered, whole-PH) ---
  function initializeSearch() {
    if (!searchInput || !searchResults) return;

    let debounceTimer;

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const query = searchInput.value.trim();

      if (query === "") {
        searchResults.innerHTML = "";
        searchResults.style.display = "none";
        return;
      }

      debounceTimer = setTimeout(() => runSearch(query), 400);
    });

    async function runSearch(query) {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=12.8797&lon=121.7740&bbox=116.87,4.59,126.60,21.32`
        );
        const data = await res.json();
        renderResults(data.features || []);
      } catch (err) {
        console.error("Search failed:", err);
        searchResults.style.display = "none";
      }
    }

    function renderResults(features) {
      searchResults.innerHTML = "";

      if (features.length === 0) {
        searchResults.style.display = "none";
        return;
      }

      features.forEach(feature => {
        const props = feature.properties;
        const label = [props.name, props.city, props.state]
          .filter(Boolean)
          .join(", ");

        const item = document.createElement("div");
        item.className = "search-item";
        item.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${label}`;

        item.addEventListener("click", () => {
          selectSearchResult(feature, label);
          searchResults.style.display = "none";
        });

        searchResults.appendChild(item);
      });

      searchResults.style.display = "block";
    }

    function selectSearchResult(feature, label) {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      const rawProvince = (props.state || props.county || props.city || "").trim();
      const rawName = (props.name || "").trim();

      searchInput.value = label;

      const matchedProvince = provinceList.find(p => {
        const pLower = p.toLowerCase();
        return (rawProvince && (rawProvince.toLowerCase().includes(pLower) || pLower.includes(rawProvince.toLowerCase())))
          || (rawName && (rawName.toLowerCase().includes(pLower) || pLower.includes(rawName.toLowerCase())));
      });

      function focusResult() {
        if (props.extent && props.extent.length === 4) {
          const [west, north, east, south] = props.extent;
          map.fitBounds(
            [[west, south], [east, north]],
            { padding: 60, duration: 1200, maxZoom: 17 }
          );
        } else {
          map.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
        }
      }

      if (matchedProvince) {
        if (provinceSelect) provinceSelect.value = matchedProvince;
        loadProvince(matchedProvince);
        map.once("idle", focusResult);
      } else {
        console.warn("No matching province for search result:", rawProvince || rawName || "(no state/county/city/name returned)");
        focusResult();
      }
    }
  }

  // Hide Search Dropdown on Click Outside
  document.addEventListener("click", (e) => {
    if (searchResults && searchInput) {
      if (!e.target.closest(".search-wrapper") && !e.target.closest("#search-results")) {
        searchResults.style.display = "none";
      }
    }
  });

  function populateProvinceDropdown() {
    if (!provinceSelect) return;
    provinceList = [...provinceSelect.options]
      .filter(option => option.value !== "")
      .map(option => option.value);
  }

  // Mobile Sidebar Handlers
  if (mobileMenuBtn && sidebar && sidebarOverlay) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      sidebarOverlay.classList.toggle("active", isOpen);
      if (mobileMenuIcon) {
        mobileMenuIcon.classList.toggle("fa-bars", !isOpen);
        mobileMenuIcon.classList.toggle("fa-xmark", isOpen);
      }
    });

    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarOverlay.classList.remove("active");
      if (mobileMenuIcon) {
        mobileMenuIcon.classList.remove("fa-xmark");
        mobileMenuIcon.classList.add("fa-bars");
      }
    });
  }

  // Initialize Search Listener
  initializeSearch();

  // Export initializeMap globally
  window.initializeMap = initializeMap;
});